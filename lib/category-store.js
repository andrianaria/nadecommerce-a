import fs from "fs/promises";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "product-categories.json");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeCategory(input) {
  const name = String(input.name || "").trim();
  const slug = slugify(input.slug || name);

  return {
    id: String(input.id || slug),
    name,
    slug
  };
}

async function readCategories() {
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.map(normalizeCategory).sort((a, b) => a.name.localeCompare(b.name));
}

async function writeCategories(categories) {
  await fs.writeFile(dataFile, `${JSON.stringify(categories, null, 2)}\n`, "utf8");
}

export async function listProductCategories() {
  return readCategories();
}

export async function createProductCategory(input) {
  const category = normalizeCategory(input);

  if (!category.name) {
    throw new Error("Nama kategori wajib diisi.");
  }

  const categories = await readCategories();
  const exists = categories.some(
    (entry) => entry.slug === category.slug || entry.name.toLowerCase() === category.name.toLowerCase()
  );

  if (exists) {
    throw new Error("Kategori sudah ada.");
  }

  const next = [...categories, category].sort((a, b) => a.name.localeCompare(b.name));
  await writeCategories(next);
  return category;
}

export async function deleteProductCategory(id) {
  const categories = await readCategories();
  const next = categories.filter((entry) => entry.id !== id && entry.slug !== id);

  if (next.length === categories.length) {
    throw new Error("Kategori tidak ditemukan.");
  }

  await writeCategories(next);
}

export function categorySlugFromName(name) {
  return slugify(name);
}
