/**
 * Conexao SQLite com better-sqlite3.
 * Configura WAL, foreign keys, busy timeout e carrega o schema.
 * @module db
 */

import Database from "better-sqlite3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env antes de acessar process.env (imports ES Module sao hoisted)
dotenv.config({ path: path.join(__dirname, ".env") });

// Caminho do banco (configuravel via .env)
const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : path.join(__dirname, "data", "iafiliado.db");

// Garante que o diretorio existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Abre o banco
const db = new Database(dbPath);

// PRAGMAs de seguranca e performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// Carrega e executa o schema (CREATE TABLE IF NOT EXISTS — idempotente)
const schemaPath = path.join(__dirname, "schema.sql");
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);
}

// Log de conexao (visivel em qualquer ambiente)
console.log("SQLite conectado:", dbPath);

// Verifica saude do banco na inicializacao (apenas em dev)
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  const integrity = db.pragma("integrity_check");
  const status = integrity[0]?.integrity_check || "ok";
  if (status !== "ok") {
    console.error("AVISO: integrity_check retornou:", status);
  }
}

export default db;
