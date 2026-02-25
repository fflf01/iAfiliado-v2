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

function ensureDefaultValue(table, column, wantedDefaultSqlLiteral) {
  // SQLite nao permite alterar DEFAULT via ALTER COLUMN. Entao isto e best-effort
  // para bases antigas: nao tenta recriar tabela automaticamente.
  // Serve apenas como "documentacao viva" e ponto unico para future migrations.
  void table;
  void column;
  void wantedDefaultSqlLiteral;
}

// Backfill/migrations leves para manter compatibilidade com bancos antigos.
// (CREATE TABLE IF NOT EXISTS não adiciona colunas em tabelas já existentes)
try {
  ensureColumn("casinos", "url_afiliado", "TEXT");
  ensureColumn("casinos", "comissao_cpa", "REAL NOT NULL DEFAULT 0");
  ensureColumn("casinos", "comissao_revshare", "REAL NOT NULL DEFAULT 0");
  ensureColumn("casinos", "comissao_depositoc", "REAL NOT NULL DEFAULT 0");
  // Índices para acelerar consultas de métricas e auditoria em entradas
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_entradas_user_date ON entradas(user_id, data_hora);",
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_entradas_casino_date ON entradas(casino_id, data_hora);",
  );
  ensureColumn("users", "cpf_cnpj", "TEXT");
  ensureColumn("users", "cadastro_status", "TEXT");
  // Punição / bloqueio de usuário (admin)
  ensureColumn("users", "is_blocked", "INTEGER NOT NULL DEFAULT 0 CHECK(is_blocked IN (0, 1))");
  ensureColumn("users", "blocked_reason", "TEXT");
  ensureColumn("users", "blocked_at", "TEXT");
  ensureColumn("users", "is_manager", "INTEGER NOT NULL DEFAULT 0");
  // Tabela para contas que cada manager pode visualizar/administrar
  if (!db.pragma("table_info(manager_managed_accounts)").length) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS manager_managed_accounts (
        manager_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        managed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (manager_id, managed_user_id)
      ); CREATE INDEX IF NOT EXISTS idx_manager_managed_accounts_manager_id ON manager_managed_accounts(manager_id);`,
    );
  }
  // contracts.status default no schema e 'pendente' (bases antigas podem manter 'ativo')
  ensureDefaultValue("contracts", "status", "'pendente'");
} catch (err) {
  logger.warn("Falha ao aplicar migrations leves no SQLite", {
    error: err.message,
  });
}

// Seed: casas listadas em Plataformas_D.tsx (INSERT OR IGNORE para nao duplicar)
const defaultCasinos = [
  {
    id: "brasilbet",
    name: "BrasilBet",
    comissao_cpa: 0,
    comissao_revshare: 11,
    comissao_depositoc: 0,
  },
  {
    id: "betsul",
    name: "BetSul",
    comissao_cpa: 0,
    comissao_revshare: 10,
    comissao_depositoc: 0,
  },
  {
    id: "multibet",
    name: "Multibet",
    comissao_cpa: 0,
    comissao_revshare: 10,
    comissao_depositoc: 0,
  },
  {
    id: "betmgm",
    name: "BetMGM",
    comissao_cpa: 100,
    comissao_revshare: 0,
    comissao_depositoc: 0,
  },
  {
    id: "luvabet",
    name: "LuvaBet",
    comissao_cpa: 0,
    comissao_revshare: 11,
    comissao_depositoc: 0,
  },
  {
    id: "bigbet",
    name: "BigBet",
    comissao_cpa: 0,
    comissao_revshare: 10,
    comissao_depositoc: 0,
  },
  {
    id: "betmgmpro",
    name: "BetMGM Pro",
    comissao_cpa: 80,
    comissao_revshare: 0,
    comissao_depositoc: 0,
  },
  {
    id: "seubet",
    name: "SeuBet",
    comissao_cpa: 0,
    comissao_revshare: 60,
    comissao_depositoc: 0,
  },
];
try {
  const insertCasino = db.prepare(
    `INSERT OR IGNORE INTO casinos (id, name, url, url_afiliado, comissao_cpa, comissao_revshare, comissao_depositoc, status)
     VALUES (?, ?, NULL, NULL, ?, ?, ?, 'active')`,
  );
  for (const c of defaultCasinos) {
    insertCasino.run(
      c.id,
      c.name,
      c.comissao_cpa,
      c.comissao_revshare,
      c.comissao_depositoc,
    );
  }
} catch (err) {
  logger.warn("Falha ao seed de casinos padrao", { error: err.message });
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
