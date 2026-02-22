-- ============================================================
-- iAfiliado v2 — Schema SQLite relacional normalizado
-- Migrado de Supabase (PostgreSQL) document-store para SQLite
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

-- Usuarios (merge de clients + users do JSON original)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    UNIQUE NOT NULL,
  full_name     TEXT    NOT NULL,
  email         TEXT    UNIQUE NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  phone         TEXT,
  tipo_cliente  TEXT,
  tele_an       TEXT,
  rede_an       TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
) STRICT;

-- Casinos / Plataformas
CREATE TABLE IF NOT EXISTS casinos (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT,
  url_afiliado TEXT,
  comissao_cpa REAL NOT NULL DEFAULT 0,
  comissao_revshare REAL NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Features de cada casino (extraido do array JSON features)
CREATE TABLE IF NOT EXISTS casino_features (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  casino_id TEXT NOT NULL REFERENCES casinos(id) ON DELETE CASCADE,
  feature   TEXT NOT NULL
);

-- Relacao afiliado <-> casino
CREATE TABLE IF NOT EXISTS affiliate_casinos (
  id         TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  casino_id  TEXT    NOT NULL REFERENCES casinos(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL DEFAULT 'active',
  start_date TEXT,
  link       TEXT
);

-- Acordos comerciais de cada vinculo afiliado-casino
CREATE TABLE IF NOT EXISTS affiliate_agreements (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_casino_id TEXT NOT NULL REFERENCES affiliate_casinos(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  commission          REAL NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active'
);

-- Metricas / Entradas (cliques, registros, depositos, FTD)
CREATE TABLE IF NOT EXISTS entradas (
  id              TEXT    PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  casino_id       TEXT    NOT NULL REFERENCES casinos(id) ON DELETE CASCADE,
  data_hora       INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  depositos       INTEGER NOT NULL DEFAULT 0,
  cliques         INTEGER NOT NULL DEFAULT 0,
  registros       INTEGER NOT NULL DEFAULT 0,
  ftd             INTEGER NOT NULL DEFAULT 0,
  valor_recebido  REAL    NOT NULL DEFAULT 0
);

-- Totais de carteira por usuario (relacao 1:1)
CREATE TABLE IF NOT EXISTS wallet_totals (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  valor_recebido_total REAL NOT NULL DEFAULT 0,
  saldo_disponivel     REAL NOT NULL DEFAULT 0,
  valor_total_sacado   REAL NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contratos entre casas e afiliados
CREATE TABLE IF NOT EXISTS contracts (
  id                TEXT PRIMARY KEY,
  casa_id           TEXT    NOT NULL REFERENCES casinos(id) ON DELETE CASCADE,
  afiliado_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo              TEXT,
  valor             TEXT,
  status            TEXT NOT NULL DEFAULT 'ativo',
  data_criacao      TEXT NOT NULL DEFAULT (datetime('now')),
  data_atualizacao  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- TABELAS DE SUPORTE (preservadas do schema PostgreSQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS support_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  subject     TEXT,
  message     TEXT    NOT NULL,
  priority    TEXT    NOT NULL DEFAULT 'medium',
  phone       TEXT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ticket_code TEXT,
  status      TEXT    NOT NULL DEFAULT 'aberto',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_replies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id   INTEGER NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_type TEXT    NOT NULL CHECK(sender_type IN ('user', 'support')),
  message     TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_attachments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
  filename  TEXT    NOT NULL,
  path      TEXT    NOT NULL,
  mimetype  TEXT    NOT NULL
);

-- ============================================================
-- TRIGGERS — auto-atualizar updated_at
-- ============================================================

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_casinos_updated_at
AFTER UPDATE ON casinos
FOR EACH ROW
BEGIN
  UPDATE casinos SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_wallet_totals_updated_at
AFTER UPDATE ON wallet_totals
FOR EACH ROW
BEGIN
  UPDATE wallet_totals SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_contracts_updated_at
AFTER UPDATE ON contracts
FOR EACH ROW
BEGIN
  UPDATE contracts SET data_atualizacao = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================
-- INDICES — performance em queries frequentes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_entradas_user           ON entradas(user_id);
CREATE INDEX IF NOT EXISTS idx_entradas_casino         ON entradas(casino_id);
CREATE INDEX IF NOT EXISTS idx_entradas_data           ON entradas(data_hora);
CREATE INDEX IF NOT EXISTS idx_affiliate_casinos_user  ON affiliate_casinos(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_casinos_casino ON affiliate_casinos(casino_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user   ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_replies_ticket  ON support_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_contracts_afiliado      ON contracts(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_contracts_casa          ON contracts(casa_id);
CREATE INDEX IF NOT EXISTS idx_wallet_totals_user      ON wallet_totals(user_id);
