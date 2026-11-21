import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { outlets as fallbackOutlets } from "@/lib/outlets";
import { hasMySqlEnv, hasSupabaseServerEnv } from "@/lib/store-config";
import { isMySqlConnectionError, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { supabaseRequest } from "@/lib/supabase-rest";

const dataFile = path.join(process.cwd(), "data", "outlets.json");

async function readLocalOutlets() {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallbackOutlets.map((outlet) => normalizeOutlet(outlet));
    }

    throw error;
  }
}

async function writeLocalOutlets(outlets) {
  await fs.writeFile(dataFile, `${JSON.stringify(outlets, null, 2)}\n`, "utf8");
}

function normalizeKeywords(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
  }
  return Boolean(value);
}

function normalizeIsoDate(value, fallback) {
  if (!value) {
    return fallback || new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? (fallback || new Date().toISOString()) : parsed.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return fallback || new Date().toISOString();
}

function normalizeOutlet(input) {
  const fallbackCreatedAt = new Date().toISOString();
  const fallbackUpdatedAt = fallbackCreatedAt;

  return {
    id: input.id || randomUUID(),
    slug: input.slug || input.id || "",
    code: input.code || null,
    name: String(input.name || "").trim(),
    shortLabel: String(input.shortLabel || input.short_label || input.name || "").trim(),
    address: String(
      input.address ||
        input.address_line_1 ||
        [input.address_line_1, input.address_line_2].filter(Boolean).join(", ")
    ).trim(),
    city: String(input.city || "").trim(),
    province: String(input.province || "").trim(),
    latitude:
      input.latitude === null || input.latitude === undefined || input.latitude === ""
        ? null
        : Number(input.latitude),
    longitude:
      input.longitude === null || input.longitude === undefined || input.longitude === ""
        ? null
        : Number(input.longitude),
    keywords: normalizeKeywords(input.keywords),
    isActive:
      input.isActive !== undefined
        ? normalizeBoolean(input.isActive, true)
        : normalizeBoolean(input.is_active, true),
    createdAt: normalizeIsoDate(input.createdAt || input.created_at, fallbackCreatedAt),
    updatedAt: normalizeIsoDate(input.updatedAt || input.updated_at, fallbackUpdatedAt)
  };
}

function mapSupabaseOutlet(entry) {
  return normalizeOutlet({
    id: entry.id,
    slug: entry.slug,
    code: entry.code,
    name: entry.name,
    short_label: entry.short_label,
    address_line_1: entry.address_line_1,
    address_line_2: entry.address_line_2,
    city: entry.city,
    province: entry.province,
    latitude: entry.latitude,
    longitude: entry.longitude,
    keywords: entry.keywords,
    is_active: entry.is_active,
    created_at: entry.created_at,
    updated_at: entry.updated_at
  });
}

function mapOutletInsert(outlet) {
  return {
    id: outlet.id,
    slug: outlet.slug,
    code: outlet.code,
    name: outlet.name,
    short_label: outlet.shortLabel,
    address_line_1: outlet.address,
    city: outlet.city || null,
    province: outlet.province || null,
    latitude: outlet.latitude,
    longitude: outlet.longitude,
    is_active: outlet.isActive,
    keywords: outlet.keywords
  };
}

export async function listOutlets() {
  if (hasMySqlEnv()) {
    try {
      const rows = await mysqlQuery("select * from outlets order by name asc");
      return rows.map((row) =>
        normalizeOutlet({
          id: row.id,
          slug: row.slug,
          code: row.code,
          name: row.name,
          shortLabel: row.short_label,
          address: [row.address_line_1, row.address_line_2].filter(Boolean).join(", "),
          city: row.city,
          province: row.province,
          latitude: row.latitude,
          longitude: row.longitude,
          is_active: row.is_active,
          keywords:
            !row.keywords
              ? []
              : typeof row.keywords === "string"
                ? JSON.parse(row.keywords)
                : row.keywords,
          created_at: row.created_at,
          updated_at: row.updated_at
        })
      );
    } catch (error) {
      if (isMySqlConnectionError(error) || String(error?.message || "").includes("ETIMEDOUT")) {
        return readLocalOutlets();
      }
      throw error;
    }
  }

  if (hasSupabaseServerEnv()) {
    const rows = await supabaseRequest("outlets", {
      query: {
        select: "*",
        order: "name.asc"
      }
    });

    return (rows || []).map(mapSupabaseOutlet);
  }

  const outlets = await readLocalOutlets();
  return outlets.sort((left, right) => left.name.localeCompare(right.name));
}

export async function createOutlet(input) {
  const outlet = normalizeOutlet(input);

  if (hasMySqlEnv()) {
    await mysqlExecute(
      `insert into outlets
        (id, slug, code, name, short_label, address_line_1, address_line_2, city, province, latitude, longitude, is_active, keywords, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        outlet.id,
        outlet.slug,
        outlet.code,
        outlet.name,
        outlet.shortLabel,
        outlet.address,
        null,
        outlet.city || null,
        outlet.province || null,
        outlet.latitude,
        outlet.longitude,
        outlet.isActive ? 1 : 0,
        JSON.stringify(outlet.keywords || [])
      ]
    );
    return outlet;
  }

  if (hasSupabaseServerEnv()) {
    const rows = await supabaseRequest("outlets", {
      method: "POST",
      body: [mapOutletInsert(outlet)]
    });

    return rows?.[0] ? mapSupabaseOutlet(rows[0]) : outlet;
  }

  const outlets = await readLocalOutlets();
  outlets.unshift(outlet);
  await writeLocalOutlets(outlets);
  return outlet;
}

export async function updateOutlet(id, input) {
  if (hasMySqlEnv()) {
    const outlet = normalizeOutlet({ ...input, id });
    await mysqlExecute(
      `update outlets
       set slug=?, code=?, name=?, short_label=?, address_line_1=?, city=?, province=?, latitude=?, longitude=?, is_active=?, keywords=?, updated_at=now()
       where id=?`,
      [
        outlet.slug,
        outlet.code,
        outlet.name,
        outlet.shortLabel,
        outlet.address,
        outlet.city || null,
        outlet.province || null,
        outlet.latitude,
        outlet.longitude,
        outlet.isActive ? 1 : 0,
        JSON.stringify(outlet.keywords || []),
        id
      ]
    );
    return outlet;
  }

  if (hasSupabaseServerEnv()) {
    const outlet = normalizeOutlet({ ...input, id });
    const rows = await supabaseRequest("outlets", {
      method: "PATCH",
      query: {
        id: `eq.${id}`,
        select: "*"
      },
      body: {
        ...mapOutletInsert(outlet),
        updated_at: new Date().toISOString()
      }
    });

    return rows?.[0] ? mapSupabaseOutlet(rows[0]) : null;
  }

  const outlets = await readLocalOutlets();
  const index = outlets.findIndex((entry) => entry.id === id);

  if (index === -1) {
    return null;
  }

  outlets[index] = normalizeOutlet({
    ...outlets[index],
    ...input,
    id,
    updatedAt: new Date().toISOString()
  });
  await writeLocalOutlets(outlets);
  return outlets[index];
}

export async function deleteOutlet(id) {
  if (hasMySqlEnv()) {
    await mysqlExecute("delete from outlets where id = ?", [id]);
    return true;
  }

  if (hasSupabaseServerEnv()) {
    await supabaseRequest("outlets", {
      method: "DELETE",
      query: {
        id: `eq.${id}`
      }
    });
    return true;
  }

  const outlets = await readLocalOutlets();
  const next = outlets.filter((entry) => entry.id !== id);
  await writeLocalOutlets(next);
  return next.length !== outlets.length;
}
