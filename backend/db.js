/**
 * Pool de conexoes PostgreSQL com SSL automatico para hosts remotos.
 * @module db
 */

import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const { Pool } = pg;
const isProduction = process.env.NODE_ENV === "production";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  statement_timeout: 30000, // 30s timeout para queries
};

if (!dbConfig.password) {
  console.warn("Aviso: DB_PASSWORD nao definido nas variaveis de ambiente.");
}

// SSL automatico para hosts remotos (ex: Supabase)
if (dbConfig.host !== "localhost" && dbConfig.host !== "127.0.0.1") {
  dbConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(dbConfig);

pool
  .query("SELECT 1")
  .then(() => {
    if (!isProduction) console.log("Conectado ao PostgreSQL");
  })
  .catch((err) => console.error("Erro ao conectar ao PostgreSQL:", err.message));
