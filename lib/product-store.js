import fs from "fs/promises";
import path from "path";
import { hasMySqlEnv, hasSupabaseServerEnv } from "@/lib/store-config";
import { isMySqlConnectionError, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { supabaseRequest } from "@/lib/supabase-rest";
import { inferProductDeliverySize, normalizeDeliverySize } from "@/lib/delivery-vehicle";

const dataFile = path.join(process.cwd(), "data", "products.json");
const MAX_DB_IMAGE_URL_LENGTH = 255;

function toPersistedCoverImageValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (normalized.length > MAX_DB_IMAGE_URL_LENGTH) {
    return null;
  }
  return normalized;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeProduct(input) {
  const name = String(input.name || "").trim();
  const items = Array.isArray(input.items)
    ? input.items
    : String(input.items || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    dbId: null,
    id: String(input.id || slugify(name)),
    name,
    category: String(input.category || "Sushi Cake").trim(),
    price: Number(input.price || 0),
    serves: String(input.serves || "").trim(),
    pieces: Number(input.pieces || 0),
    description: String(input.description || "").trim(),
    tagline: String(input.tagline || "").trim(),
    theme: String(input.theme || "salmon-sunrise").trim(),
    featured: Boolean(input.featured),
    spotlight: Boolean(input.spotlight),
    spicyLevel: String(input.spicyLevel || "Mild").trim(),
    items,
    imageUrls: Array.isArray(input.imageUrls)
      ? input.imageUrls.filter(Boolean).slice(0, 4)
      : [],
    availableOutletSlugs: Array.isArray(input.availableOutletSlugs)
      ? input.availableOutletSlugs.filter(Boolean)
      : [],
    coverImageUrl: String(input.coverImageUrl || "").trim() || null,
    videoUrl: String(input.videoUrl || "").trim() || null,
    deliverySize: normalizeDeliverySize(input.deliverySize || inferProductDeliverySize(input))
  };
}

function mapSupabaseProduct(entry) {
  return {
    dbId: entry.id,
    id: entry.slug,
    name: entry.name,
    category: entry.category,
    price: entry.price,
    serves: entry.serves,
    pieces: entry.pieces,
    description: entry.description,
    tagline: entry.tagline,
    theme: entry.theme,
    featured: entry.is_featured ?? entry.featured,
    spotlight: Boolean(entry.metadata?.spotlight),
    spicyLevel: entry.spicy_level,
    imageUrls: Array.isArray(entry.metadata?.imageUrls)
      ? entry.metadata.imageUrls.slice(0, 4)
      : entry.image_url
        ? [entry.image_url]
        : [],
    availableOutletSlugs: Array.isArray(entry.metadata?.availableOutletSlugs)
      ? entry.metadata.availableOutletSlugs
      : [],
    coverImageUrl: entry.metadata?.coverImageUrl || entry.image_url || null,
    videoUrl: entry.metadata?.videoUrl || null,
    deliverySize: normalizeDeliverySize(entry.metadata?.deliverySize || inferProductDeliverySize(entry)),
    items: (entry.product_items || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.label)
  };
}

async function readProducts() {
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.sort((a, b) => Number(b.featured) - Number(a.featured));
}

async function writeProducts(products) {
  await fs.writeFile(dataFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

function applySingleSpotlight(products, spotlightId) {
  if (!spotlightId) {
    return products;
  }

  return products.map((entry) => ({
    ...entry,
    spotlight: entry.id === spotlightId
  }));
}

function finalizeProductMedia(product) {
  return {
    ...product,
    coverImageUrl:
      product.coverImageUrl && product.imageUrls.includes(product.coverImageUrl)
        ? product.coverImageUrl
        : product.imageUrls[0] || null
  };
}

async function getSupabaseProducts() {
  try {
    const data = await supabaseRequest("products", {
      query: {
        select: "*,product_items(*)",
        order: "is_featured.desc,created_at.desc"
      }
    });

    return data.map(mapSupabaseProduct);
  } catch (error) {
    if (error.message.includes("public.products")) {
      return readProducts();
    }

    throw error;
  }
}

function mapMySqlProduct(row) {
  const metadata =
    !row.metadata
      ? {}
      : typeof row.metadata === "string"
        ? JSON.parse(row.metadata)
        : row.metadata;
  return {
    dbId: null,
    id: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price || 0),
    serves: row.serves || "",
    pieces: Number(row.pieces || 0),
    description: row.description || "",
    tagline: row.tagline || "",
    theme: row.theme || "salmon-sunrise",
    featured: Boolean(row.is_featured),
    spotlight: Boolean(metadata?.spotlight),
    spicyLevel: row.spicy_level || "Mild",
    imageUrls: Array.isArray(metadata?.imageUrls) ? metadata.imageUrls.slice(0, 4) : [],
    availableOutletSlugs: Array.isArray(metadata?.availableOutletSlugs)
      ? metadata.availableOutletSlugs
      : [],
    coverImageUrl: metadata?.coverImageUrl || null,
    videoUrl: metadata?.videoUrl || null,
    deliverySize: normalizeDeliverySize(metadata?.deliverySize || inferProductDeliverySize(row)),
    items: Array.isArray(metadata?.items) ? metadata.items : []
  };
}

async function getMySqlProducts() {
  try {
    const orderedSlugRows = await mysqlQuery(
      "select slug from products order by is_featured desc, created_at desc"
    );
    const orderedSlugs = orderedSlugRows.map((row) => row.slug).filter(Boolean);

    if (!orderedSlugs.length) {
      return [];
    }

    const placeholders = orderedSlugs.map(() => "?").join(", ");
    const rows = await mysqlQuery(
      `select * from products where slug in (${placeholders})`,
      orderedSlugs
    );
    const outletRows = await mysqlQuery(
      "select product_slug, outlet_slug from product_outlets order by product_slug asc, outlet_slug asc"
    );
    const outletsByProduct = new Map();
    const rowsBySlug = new Map(rows.map((row) => [row.slug, row]));

    for (const row of outletRows) {
      const current = outletsByProduct.get(row.product_slug) || [];
      current.push(row.outlet_slug);
      outletsByProduct.set(row.product_slug, current);
    }

    return orderedSlugs
      .map((slug) => rowsBySlug.get(slug))
      .filter(Boolean)
      .map((row) => ({
        ...mapMySqlProduct(row),
        availableOutletSlugs: outletsByProduct.get(row.slug) || []
      }));
  } catch (error) {
    // Keep storefront usable even if the DB is temporarily unreachable.
    if (isMySqlConnectionError(error) || String(error?.message || "").includes("ETIMEDOUT")) {
      return readProducts();
    }
    throw error;
  }
}

export async function getProducts() {
  if (hasMySqlEnv()) return getMySqlProducts();
  return hasSupabaseServerEnv() ? getSupabaseProducts() : readProducts();
}

export async function createProduct(input) {
  const product = finalizeProductMedia(normalizeProduct(input));

  if (!product.name) {
    throw new Error("Product name is required.");
  }

  if (hasMySqlEnv()) {
    const metadata = JSON.stringify({
      imageUrls: product.imageUrls,
      coverImageUrl: product.coverImageUrl,
      videoUrl: product.videoUrl,
      spotlight: product.spotlight,
      items: product.items,
      availableOutletSlugs: product.availableOutletSlugs,
      deliverySize: product.deliverySize
    });

    await mysqlExecute(
      `insert into products
        (slug, name, category, price, serves, pieces, description, tagline, theme, is_featured, image_url, spicy_level, metadata)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `,
      [
        product.id,
        product.name,
        product.category,
        product.price,
        product.serves,
        product.pieces,
        product.description,
        product.tagline,
        product.theme,
        product.featured ? 1 : 0,
        toPersistedCoverImageValue(product.coverImageUrl),
        product.spicyLevel,
        metadata
      ]
    );

    if (product.spotlight) {
      await mysqlExecute(
        "update products set metadata = json_set(coalesce(metadata, '{}'), '$.spotlight', false) where slug <> ?",
        [product.id]
      );
    }

    if (product.availableOutletSlugs.length) {
      for (const outletSlug of product.availableOutletSlugs) {
        await mysqlExecute(
          `insert into product_outlets (product_slug, outlet_slug)
           values (?, ?)`,
          [product.id, outletSlug]
        );
      }
    }

    return product;
  }

  if (hasSupabaseServerEnv()) {
    const [created] = await supabaseRequest("products", {
      method: "POST",
      body: [
        {
          slug: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          serves: product.serves,
          pieces: product.pieces,
          description: product.description,
          tagline: product.tagline,
          theme: product.theme,
          is_featured: product.featured,
          image_url: toPersistedCoverImageValue(product.coverImageUrl),
          spicy_level: product.spicyLevel,
          metadata: {
            imageUrls: product.imageUrls,
            coverImageUrl: product.coverImageUrl,
            videoUrl: product.videoUrl,
            spotlight: product.spotlight,
            availableOutletSlugs: product.availableOutletSlugs,
            deliverySize: product.deliverySize
          }
        }
      ]
    });

    if (product.spotlight) {
      const rows = await supabaseRequest("products", {
        query: {
          select: "id,metadata"
        }
      });

      for (const row of rows) {
        if (row.id !== created.id && row.metadata?.spotlight) {
          await supabaseRequest("products", {
            method: "PATCH",
            query: {
              id: `eq.${row.id}`
            },
            body: {
              metadata: {
                ...(row.metadata || {}),
                spotlight: false
              }
            }
          });
        }
      }
    }

    if (product.items.length) {
      await supabaseRequest("product_items", {
        method: "POST",
        body: product.items.map((label, index) => ({
          product_id: created.id,
          label,
          sort_order: index
        }))
      });
    }

    return product;
  }

  const products = await readProducts();

  if (products.some((entry) => entry.id === product.id)) {
    throw new Error("A product with the same ID already exists.");
  }

  products.unshift(product);
  const finalProducts = product.spotlight ? applySingleSpotlight(products, product.id) : products;
  await writeProducts(finalProducts);
  return finalProducts.find((entry) => entry.id === product.id);
}

export async function updateProduct(id, input) {
  const currentProducts = await getProducts();
  const current = currentProducts.find((entry) => entry.id === id);

  if (!current) {
    throw new Error("Product not found.");
  }

  const merged = finalizeProductMedia(normalizeProduct({
    ...current,
    ...input,
    id
  }));

  if (hasMySqlEnv()) {
    const metadata = JSON.stringify({
      imageUrls: merged.imageUrls,
      coverImageUrl: merged.coverImageUrl,
      videoUrl: merged.videoUrl,
      spotlight: merged.spotlight,
      items: merged.items,
      availableOutletSlugs: merged.availableOutletSlugs,
      deliverySize: merged.deliverySize
    });

    await mysqlExecute(
      `update products
       set name=?, category=?, price=?, serves=?, pieces=?, description=?, tagline=?, theme=?, is_featured=?, image_url=?, spicy_level=?, metadata=?, updated_at=now()
       where slug=?`,
      [
        merged.name,
        merged.category,
        merged.price,
        merged.serves,
        merged.pieces,
        merged.description,
        merged.tagline,
        merged.theme,
        merged.featured ? 1 : 0,
        toPersistedCoverImageValue(merged.coverImageUrl),
        merged.spicyLevel,
        metadata,
        id
      ]
    );

    if (merged.spotlight) {
      await mysqlExecute(
        "update products set metadata = json_set(coalesce(metadata, '{}'), '$.spotlight', false) where slug <> ?",
        [id]
      );
    }

    await mysqlExecute("delete from product_outlets where product_slug = ?", [id]);

    if (merged.availableOutletSlugs.length) {
      for (const outletSlug of merged.availableOutletSlugs) {
        await mysqlExecute(
          `insert into product_outlets (product_slug, outlet_slug)
           values (?, ?)`,
          [id, outletSlug]
        );
      }
    }

    return merged;
  }

  if (hasSupabaseServerEnv()) {
    const rows = await supabaseRequest("products", {
      query: {
        slug: `eq.${id}`,
        select: "id"
      }
    });

    const supabaseId = rows?.[0]?.id;

    if (!supabaseId) {
      throw new Error("Product not found.");
    }

    await supabaseRequest("products", {
      method: "PATCH",
      query: {
        slug: `eq.${id}`
      },
      body: {
        name: merged.name,
        category: merged.category,
        price: merged.price,
        serves: merged.serves,
        pieces: merged.pieces,
        description: merged.description,
        tagline: merged.tagline,
        theme: merged.theme,
        is_featured: merged.featured,
        image_url: toPersistedCoverImageValue(merged.coverImageUrl),
        spicy_level: merged.spicyLevel,
        metadata: {
          imageUrls: merged.imageUrls,
          coverImageUrl: merged.coverImageUrl,
          videoUrl: merged.videoUrl,
          spotlight: merged.spotlight,
          availableOutletSlugs: merged.availableOutletSlugs,
          deliverySize: merged.deliverySize
        },
        updated_at: new Date().toISOString()
      }
    });

    if (merged.spotlight) {
      const rows = await supabaseRequest("products", {
        query: {
          select: "id,metadata"
        }
      });

      for (const row of rows) {
        if (row.id !== supabaseId && row.metadata?.spotlight) {
          await supabaseRequest("products", {
            method: "PATCH",
            query: {
              id: `eq.${row.id}`
            },
            body: {
              metadata: {
                ...(row.metadata || {}),
                spotlight: false
              }
            }
          });
        }
      }
    }

    await supabaseRequest("product_items", {
      method: "DELETE",
      query: {
        product_id: `eq.${supabaseId}`
      },
      headers: {
        Prefer: "return=minimal"
      }
    });

    if (merged.items.length) {
      await supabaseRequest("product_items", {
        method: "POST",
        body: merged.items.map((label, index) => ({
          product_id: supabaseId,
          label,
          sort_order: index
        }))
      });
    }

    return merged;
  }

  const localProducts = await readProducts();
  const index = localProducts.findIndex((entry) => entry.id === id);
  localProducts[index] = merged;
  const finalProducts = merged.spotlight
    ? applySingleSpotlight(localProducts, merged.id)
    : localProducts;
  await writeProducts(finalProducts);
  return finalProducts.find((entry) => entry.id === id);
}

export async function deleteProduct(id) {
  if (hasMySqlEnv()) {
    await mysqlExecute("delete from products where slug = ?", [id]);
    return true;
  }

  if (hasSupabaseServerEnv()) {
    await supabaseRequest("products", {
      method: "DELETE",
      query: {
        slug: `eq.${id}`
      },
      headers: {
        Prefer: "return=minimal"
      }
    });

    return { ok: true };
  }

  const products = await readProducts();
  const nextProducts = products.filter((entry) => entry.id !== id);

  if (nextProducts.length === products.length) {
    throw new Error("Product not found.");
  }

  await writeProducts(nextProducts);
  return { ok: true };
}
