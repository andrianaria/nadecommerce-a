/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");

const { getMySqlPool, mysqlExecute } = require("../lib/mysql.js");

function stripComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function splitStatements(sql) {
  // Good enough for our schema file (no semicolons inside strings).
  return stripComments(sql)
    .split(";")
    .map((stmt) => stmt.trim())
    .filter(Boolean);
}

async function main() {
  const schemaPath = path.join(process.cwd(), "mysql", "schema.sql");
  const raw = await fs.readFile(schemaPath, "utf8");
  const statements = splitStatements(raw);

  console.log(`Applying ${statements.length} statements from mysql/schema.sql...`);

  for (const statement of statements) {
    await mysqlExecute(statement);
  }

  console.log("MySQL migration complete.");
  await getMySqlPool().end();
}

main().catch((error) => {
  console.error("The development database operation failed.");
  process.exit(1);
});
