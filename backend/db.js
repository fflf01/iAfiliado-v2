/**
 * Conexao SQLite com better-sqlite3.
 * Configura WAL, foreign keys, busy timeout e carrega o schema.
 * @module db
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function ensureColumn(table, column, definition) {
  const cols = db.pragma(`table_info(${table})`);
  const has = cols.some((c) => c.name === column);
  if (has) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

// Backfill/migrations leves para manter compatibilidade com bancos antigos.
// (CREATE TABLE IF NOT EXISTS não adiciona colunas em tabelas já existentes)
try {
  ensureColumn("casinos", "url_afiliado", "TEXT");
  ensureColumn("casinos", "comissao_cpa", "REAL NOT NULL DEFAULT 0");
  ensureColumn("casinos", "comissao_revshare", "REAL NOT NULL DEFAULT 0");
} catch (err) {
  logger.warn("Falha ao aplicar migrations leves no SQLite", { error: err.message });
}

// Log de conexao (visivel em qualquer ambiente)
logger.info("SQLite conectado", { dbPath });

// Verifica saude do banco na inicializacao (apenas em dev)
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  const integrity = db.pragma("integrity_check");
  const status = integrity[0]?.integrity_check || "ok";
  if (status !== "ok") {
    logger.warn("integrity_check retornou status inesperado", { status });
  }
}

export default db;
