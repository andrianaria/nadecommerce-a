const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function readEnvFile(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
}

function toDbValue(value) {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

async function copyRows({ source, target, selectSql, deleteSql, insertSql, mapRow = (row) => row, label }) {
  const [rows] = await source.query(selectSql);
  await target.query(deleteSql);

  if (!rows.length) {
    console.log(`${label}: 0 rows`);
    return;
  }

  for (const row of rows) {
    const mapped = mapRow(row);
    const params = Array.isArray(mapped) ? mapped : Object.values(mapped);
    await target.execute(insertSql, params.map(toDbValue));
  }

  console.log(`${label}: ${rows.length} rows`);
}

async function main() {
  const root = process.cwd();
  const env = readEnvFile(path.join(root, ".env.local"));
  const targetHost = process.env.SANDBOX_MYSQL_HOST;
  if (!targetHost) throw new Error("SANDBOX_MYSQL_HOST is required");
  const targetPort = Number(process.env.SANDBOX_MYSQL_PORT || env.MYSQL_PORT || 3306);

  const sourceConfig = {
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    multipleStatements: true
  };

  const targetConfig = {
    host: targetHost,
    port: targetPort,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    multipleStatements: true
  };

  const schemaSql = fs
    .readFileSync(path.join(root, "mysql/schema.sql"), "utf8")
    .replaceAll("utf8mb4_0900_ai_ci", "utf8mb4_unicode_ci");
  const source = await mysql.createConnection(sourceConfig);
  const target = await mysql.createConnection(targetConfig);

  try {
    await target.query(schemaSql);

    await target.query("SET FOREIGN_KEY_CHECKS = 0");
    await target.query("TRUNCATE TABLE promotion_products");
    await target.query("TRUNCATE TABLE promotion_outlets");
    await target.query("TRUNCATE TABLE product_outlets");
    await target.query("TRUNCATE TABLE promotions");
    await target.query("TRUNCATE TABLE products");
    await target.query("TRUNCATE TABLE outlets");
    await target.query("TRUNCATE TABLE admin_users");
    await target.query("TRUNCATE TABLE admin_profiles");
    await target.query("SET FOREIGN_KEY_CHECKS = 1");

    await copyRows({
      source,
      target,
      label: "admin_users",
      selectSql:
        "select id, email, password_hash, full_name, role, is_active, created_at, updated_at from admin_users",
      deleteSql: "delete from admin_users",
      insertSql:
        "insert into admin_users (id, email, password_hash, full_name, role, is_active, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)"
    });

    await copyRows({
      source,
      target,
      label: "outlets",
      selectSql:
        "select id, slug, code, name, short_label, address_line_1, address_line_2, city, province, latitude, longitude, is_active, keywords, created_at, updated_at from outlets",
      deleteSql: "delete from outlets",
      insertSql:
        "insert into outlets (id, slug, code, name, short_label, address_line_1, address_line_2, city, province, latitude, longitude, is_active, keywords, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    });

    await copyRows({
      source,
      target,
      label: "products",
      selectSql:
        "select slug, name, category, price, serves, pieces, description, tagline, theme, is_featured, image_url, spicy_level, metadata, created_at, updated_at from products",
      deleteSql: "delete from products",
      insertSql:
        "insert into products (slug, name, category, price, serves, pieces, description, tagline, theme, is_featured, image_url, spicy_level, metadata, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    });

    await copyRows({
      source,
      target,
      label: "product_outlets",
      selectSql: "select product_slug, outlet_slug, created_at from product_outlets",
      deleteSql: "delete from product_outlets",
      insertSql:
        "insert into product_outlets (product_slug, outlet_slug, created_at) values (?, ?, ?)"
    });

    await copyRows({
      source,
      target,
      label: "promotions",
      selectSql:
        "select id, code, name, description, eligibility_scope, discount_type, discount_value, max_discount, min_subtotal, auto_apply, is_active, starts_at, ends_at, metadata, created_at, updated_at from promotions",
      deleteSql: "delete from promotions",
      insertSql:
        "insert into promotions (id, code, name, description, eligibility_scope, discount_type, discount_value, max_discount, min_subtotal, auto_apply, is_active, starts_at, ends_at, metadata, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    });

    await copyRows({
      source,
      target,
      label: "promotion_products",
      selectSql: "select promotion_id, product_slug, created_at from promotion_products",
      deleteSql: "delete from promotion_products",
      insertSql:
        "insert into promotion_products (promotion_id, product_slug, created_at) values (?, ?, ?)"
    });

    await copyRows({
      source,
      target,
      label: "promotion_outlets",
      selectSql: "select promotion_id, outlet_slug, created_at from promotion_outlets",
      deleteSql: "delete from promotion_outlets",
      insertSql:
        "insert into promotion_outlets (promotion_id, outlet_slug, created_at) values (?, ?, ?)"
    });

    console.log("Development database sync completed.");
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error("failed");
  
  process.exit(1);
});
