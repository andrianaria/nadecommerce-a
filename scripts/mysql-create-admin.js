/* eslint-disable no-console */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getMySqlPool, mysqlExecute, mysqlQuery } = require("../lib/mysql.js");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const email = requiredEnv("ADMIN_EMAIL");
  const password = requiredEnv("ADMIN_PASSWORD");
  const fullName = process.env.ADMIN_FULL_NAME || null;
  const role = process.env.ADMIN_ROLE || "owner";

  const existing = await mysqlQuery("select id from admin_users where email = ? limit 1", [
    email
  ]);

  const id = existing?.[0]?.id || crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await mysqlExecute(
    `insert into admin_users (id, email, password_hash, full_name, role, is_active)
     values (?, ?, ?, ?, ?, true)
     on duplicate key update
       password_hash=values(password_hash),
       full_name=values(full_name),
       role=values(role),
       is_active=true`,
    [id, email, passwordHash, fullName, role]
  );

  console.log("Development administrator account is ready.");
  await getMySqlPool().end();
}

main().catch((error) => {
  console.error("The development database operation failed.");
  process.exit(1);
});

