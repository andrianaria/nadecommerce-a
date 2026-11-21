import mysql from "mysql2/promise";

const globalKey = "__streetSushiMySqlPool";
const cleanupKey = "__streetSushiMySqlPoolCleanupRegistered";

function getGlobalPool() {
  return globalThis[globalKey] || null;
}

function setGlobalPool(nextPool) {
  globalThis[globalKey] = nextPool;
}

function registerPoolCleanup() {
  if (globalThis[cleanupKey]) {
    return;
  }

  globalThis[cleanupKey] = true;

  const closePool = () => {
    const existingPool = getGlobalPool();
    if (!existingPool) return;
    setGlobalPool(null);
    existingPool.end().catch(() => {});
  };

  process.once("beforeExit", closePool);
  process.once("SIGINT", closePool);
  process.once("SIGTERM", closePool);
}

function getConfig() {
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    // Fail fast in dev when the RDS SG/VPN blocks access.
    connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT || 5000),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 6),
    maxIdle: Number(process.env.MYSQL_MAX_IDLE || 4),
    idleTimeout: Number(process.env.MYSQL_IDLE_TIMEOUT || 60000),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
}

export function getMySqlPool() {
  const existingPool = getGlobalPool();
  if (existingPool) {
    return existingPool;
  }

  const nextPool = mysql.createPool(getConfig());

  const corePool = nextPool.pool;
  if (corePool?.on) {
    corePool.on("connection", (connection) => {
      connection.query("SET SESSION wait_timeout = 120");
      connection.query("SET SESSION interactive_timeout = 120");
    });
  }

  setGlobalPool(nextPool);
  registerPoolCleanup();
  return nextPool;
}

export function resetMySqlPool() {
  const existingPool = getGlobalPool();
  setGlobalPool(null);

  if (existingPool) {
    // Release all idle connections and let in-flight queries finish naturally.
    existingPool.end().catch(() => {});
  }
}

export function isMySqlConnectionError(error) {
  const code = String(error?.code || "");
  return [
    "ER_CON_COUNT_ERROR",
    "ER_USER_LIMIT_REACHED",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ENOTFOUND",
    "PROTOCOL_CONNECTION_LOST"
  ].includes(code);
}

export async function mysqlQuery(sql, params = []) {
  try {
    const [rows] = await getMySqlPool().query(sql, params);
    return rows;
  } catch (error) {
    if (isMySqlConnectionError(error)) {
      resetMySqlPool();
    }
    throw error;
  }
}

export async function mysqlExecute(sql, params = []) {
  try {
    const [result] = await getMySqlPool().execute(sql, params);
    return result;
  } catch (error) {
    if (isMySqlConnectionError(error)) {
      resetMySqlPool();
    }
    throw error;
  }
}
