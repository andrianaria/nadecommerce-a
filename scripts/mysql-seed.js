/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const { getMySqlPool, mysqlExecute, mysqlQuery } = require("../lib/mysql.js");

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalizeItems(items) {
  if (Array.isArray(items)) return items.filter(Boolean);
  if (!items) return [];
  return String(items)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function seedProducts() {
  const file = path.join(process.cwd(), "data", "products.json");
  const raw = await fs.readFile(file, "utf8");
  const products = JSON.parse(raw);

  let inserted = 0;

  for (const p of products) {
    const metadata = {
      imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls.slice(0, 4) : [],
      coverImageUrl: p.coverImageUrl || null,
      videoUrl: p.videoUrl || null,
      spotlight: Boolean(p.spotlight),
      items: normalizeItems(p.items)
    };

    // Insert if missing.
    const existing = await mysqlQuery("select slug from products where slug = ? limit 1", [
      p.id
    ]);
    if (existing.length) continue;

    await mysqlExecute(
      `insert into products
        (slug, name, category, price, serves, pieces, description, tagline, theme, is_featured, image_url, spicy_level, metadata, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.name,
        p.category || "Sushi Cake",
        Number(p.price || 0),
        p.serves || null,
        Number(p.pieces || 0),
        p.description || null,
        p.tagline || null,
        p.theme || null,
        p.featured ? 1 : 0,
        p.coverImageUrl || null,
        p.spicyLevel || null,
        JSON.stringify(metadata),
        nowIso(),
        nowIso()
      ]
    );
    inserted += 1;
  }

  console.log(`Seeded products: +${inserted}`);
}

async function seedOutlets() {
  // Use the existing fallback outlet list as seed source.
  const outletsModule = require("../lib/outlets.js");
  const outlets = outletsModule.outlets || [];

  let inserted = 0;

  for (const outlet of outlets) {
    const slug = outlet.id;
    const existing = await mysqlQuery("select id from outlets where slug = ? limit 1", [slug]);
    if (existing.length) continue;

    await mysqlExecute(
      `insert into outlets
        (id, slug, code, name, short_label, address_line_1, address_line_2, city, province, latitude, longitude, is_active, keywords, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        slug,
        null,
        outlet.name,
        outlet.shortLabel || outlet.name,
        outlet.address,
        null,
        null,
        null,
        outlet.latitude ?? null,
        outlet.longitude ?? null,
        1,
        JSON.stringify(outlet.keywords || []),
        nowIso(),
        nowIso()
      ]
    );
    inserted += 1;
  }

  console.log(`Seeded outlets: +${inserted}`);
}

async function main() {
  await seedProducts();
  await seedOutlets();
  await getMySqlPool().end();
}

main().catch((error) => {
  console.error("The development database operation failed.");
  process.exit(1);
});
