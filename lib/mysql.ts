import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getMySqlPool(): Pool {
  if (pool) return pool;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !database) {
    throw new Error("MySQL configuration missing. Set MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE in .env.local.");
  }
  pool = mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password: process.env.MYSQL_PASSWORD || "",
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    enableKeepAlive: true,
  });
  return pool;
}
