/**
 * Script de migração: SQLite document-store (JSON blobs) → SQLite relacional normalizado.
 *
 * Uso:  node backend/scripts/migrate.cjs <caminho-do-sqlite-origem>
 *
 * O banco destino é criado em backend/data/iafiliado.db.
 * Senhas são re-hashadas com bcrypt (salt rounds = 10).
 * Roda tudo em uma transaction para atomicidade.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const SALT_ROUNDS = 10;
const SOURCE_PATH = process.argv[2];

if (!SOURCE_PATH) {
  console.error("Uso: node backend/scripts/migrate.cjs <caminho-do-sqlite-origem>");
  process.exit(1);
}

if (!fs.existsSync(SOURCE_PATH)) {
  console.error(`Arquivo de origem nao encontrado: ${SOURCE_PATH}`);
  process.exit(1);
}

const DEST_DIR = path.join(__dirname, "..", "data");
const DEST_PATH = path.join(DEST_DIR, "iafiliado.db");
const SCHEMA_PATH = path.join(__dirname, "..", "schema.sql");

if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`schema.sql nao encontrado em: ${SCHEMA_PATH}`);
  process.exit(1);
}

// Se já existe um banco destino, faz backup antes de sobrescrever
if (fs.existsSync(DEST_PATH)) {
  const backupName = `iafiliado_backup_${Date.now()}.db`;
  const backupPath = path.join(DEST_DIR, backupName);
  fs.copyFileSync(DEST_PATH, backupPath);
  console.log(`Backup do banco existente: ${backupName}`);
  fs.unlinkSync(DEST_PATH);
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const log = {
  inserted: {},
  skipped: {},
  errors: [],

  addInserted(table) {
    this.inserted[table] = (this.inserted[table] || 0) + 1;
  },
  addSkipped(table, id, reason) {
    this.skipped[table] = (this.skipped[table] || 0) + 1;
    this.errors.push({ table, id, reason });
  },
  print() {
    console.log("\n========== RESULTADO DA MIGRACAO ==========\n");
    console.log("Inseridos:");
    for (const [table, count] of Object.entries(this.inserted)) {
      console.log(`  ${table}: ${count}`);
    }
    if (Object.keys(this.skipped).length > 0) {
      console.log("\nPulados (dados invalidos):");
      for (const [table, count] of Object.entries(this.skipped)) {
        console.log(`  ${table}: ${count}`);
      }
      console.log("\nDetalhes dos erros:");
      for (const err of this.errors) {
        console.log(`  [${err.table}] ID=${err.id} — ${err.reason}`);
      }
    } else {
      console.log("\nNenhum registro pulado.");
    }
    console.log("\n============================================\n");
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lê todas as linhas de uma tabela JSON do banco origem e retorna objetos parseados. */
function readJsonTable(srcDb, tableName) {
  const rows = srcDb.prepare(`SELECT ID, json FROM "${tableName}"`).all();
  return rows.map((row) => {
    try {
      const data = JSON.parse(row.json);
      return { _ID: row.ID, ...data };
    } catch {
      log.addSkipped(tableName, row.ID, "JSON invalido / nao parseavel");
      return null;
    }
  }).filter(Boolean);
}

/** Valida que os campos obrigatórios não são nulos/vazios. */
function validateRequired(record, fields, table) {
  for (const field of fields) {
    const val = record[field];
    if (val === undefined || val === null || String(val).trim() === "") {
      log.addSkipped(table, record._ID || record.id || "?", `Campo obrigatorio vazio: ${field}`);
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Migração
// ---------------------------------------------------------------------------

console.log("Abrindo banco de origem:", SOURCE_PATH);
const srcDb = new Database(SOURCE_PATH, { readonly: true });

console.log("Criando banco destino:", DEST_PATH);
const destDb = new Database(DEST_PATH);

// Configurar PRAGMAs
destDb.pragma("journal_mode = WAL");
destDb.pragma("foreign_keys = ON");

// Executar schema
console.log("Executando schema.sql...");
const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
destDb.exec(schemaSql);

// Iniciar transaction
const migrate = destDb.transaction(() => {
  // -----------------------------------------------------------------------
  // 1. USERS
  // -----------------------------------------------------------------------
  console.log("\n[1/7] Migrando users...");
  const users = readJsonTable(srcDb, "users");

  const insertUser = destDb.prepare(`
    INSERT INTO users (id, username, full_name, email, password_hash, role, is_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    if (!validateRequired(u, ["username", "fullName", "email", "password"], "users")) continue;

    const role = (u.role === "admin") ? "admin" : "user";
    const isAdmin = role === "admin" ? 1 : 0;
    const passwordHash = bcrypt.hashSync(String(u.password), SALT_ROUNDS);
    const createdAt = u.createdAt || new Date().toISOString();
    const updatedAt = u.updatedAt || createdAt;

    try {
      insertUser.run(
        Number(u.id) || null,
        String(u.username).trim(),
        String(u.fullName).trim(),
        String(u.email).trim().toLowerCase(),
        passwordHash,
        role,
        isAdmin,
        createdAt,
        updatedAt,
      );
      log.addInserted("users");
    } catch (err) {
      log.addSkipped("users", u._ID, err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 2. CASINOS
  // -----------------------------------------------------------------------
  console.log("[2/7] Migrando casinos...");
  const casinos = readJsonTable(srcDb, "casinos");

  const insertCasino = destDb.prepare(`
    INSERT INTO casinos (id, name, url, status, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFeature = destDb.prepare(`
    INSERT INTO casino_features (casino_id, feature) VALUES (?, ?)
  `);

  for (const c of casinos) {
    if (!validateRequired(c, ["name"], "casinos")) continue;

    const createdAt = c.createdAt || new Date().toISOString();
    const updatedAt = c.updatedAt || createdAt;

    try {
      insertCasino.run(
        String(c.id || c._ID),
        String(c.name).trim(),
        c.url || null,
        c.status || "active",
        c.description || null,
        createdAt,
        updatedAt,
      );
      log.addInserted("casinos");

      // Features (array)
      if (Array.isArray(c.features)) {
        for (const feat of c.features) {
          if (feat && String(feat).trim()) {
            insertFeature.run(String(c.id || c._ID), String(feat).trim());
            log.addInserted("casino_features");
          }
        }
      }
    } catch (err) {
      log.addSkipped("casinos", c._ID, err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 3. AFFILIATE CASINOS + AGREEMENTS
  // -----------------------------------------------------------------------
  console.log("[3/7] Migrando affiliate_casinos e agreements...");
  const affiliates = readJsonTable(srcDb, "affiliateCasas");

  const insertAffiliate = destDb.prepare(`
    INSERT INTO affiliate_casinos (id, user_id, casino_id, status, start_date, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertAgreement = destDb.prepare(`
    INSERT INTO affiliate_agreements (affiliate_casino_id, type, commission, status)
    VALUES (?, ?, ?, ?)
  `);

  for (const a of affiliates) {
    if (!validateRequired(a, ["userId", "casinoId"], "affiliate_casinos")) continue;

    try {
      insertAffiliate.run(
        String(a.id || a._ID),
        Number(a.userId),
        String(a.casinoId),
        a.status || "active",
        a.startDate || null,
        a.link || null,
      );
      log.addInserted("affiliate_casinos");

      // Agreements (array)
      if (Array.isArray(a.agreements)) {
        for (const ag of a.agreements) {
          if (ag && ag.type) {
            insertAgreement.run(
              String(a.id || a._ID),
              String(ag.type),
              Number(ag.commission) || 0,
              ag.status || "active",
            );
            log.addInserted("affiliate_agreements");
          }
        }
      }
    } catch (err) {
      log.addSkipped("affiliate_casinos", a._ID, err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 4. ENTRADAS (metricas)
  // -----------------------------------------------------------------------
  console.log("[4/7] Migrando entradas...");
  const entradas = readJsonTable(srcDb, "entradas");

  const insertEntrada = destDb.prepare(`
    INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const e of entradas) {
    if (!validateRequired(e, ["userId", "casinoId"], "entradas")) continue;

    try {
      insertEntrada.run(
        String(e.id || e._ID),
        Number(e.userId),
        String(e.casinoId),
        Number(e.dataHora) || 0,
        Number(e.depositos) || 0,
        Number(e.cliques) || 0,
        Number(e.registros) || 0,
        Number(e.ftd) || 0,
        Number(e.valorRecebido) || 0,
      );
      log.addInserted("entradas");
    } catch (err) {
      log.addSkipped("entradas", e._ID, err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 5. WALLET TOTALS
  // -----------------------------------------------------------------------
  console.log("[5/7] Migrando wallet_totals...");
  const wallets = readJsonTable(srcDb, "walletTotals");

  const insertWallet = destDb.prepare(`
    INSERT INTO wallet_totals (user_id, valor_recebido_total, saldo_disponivel, valor_total_sacado, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const w of wallets) {
    if (!validateRequired(w, ["userId"], "wallet_totals")) continue;

    // Converter timestamps ms para ISO se necessário
    const createdAt = w.createdAt
      ? (typeof w.createdAt === "number" ? new Date(w.createdAt).toISOString() : w.createdAt)
      : new Date().toISOString();
    const updatedAt = w.updatedAt
      ? (typeof w.updatedAt === "number" ? new Date(w.updatedAt).toISOString() : w.updatedAt)
      : createdAt;

    try {
      insertWallet.run(
        Number(w.userId),
        Number(w.valorRecebidoTotal) || 0,
        Number(w.saldoDisponivel) || 0,
        Number(w.valorTotalSacado) || 0,
        createdAt,
        updatedAt,
      );
      log.addInserted("wallet_totals");
    } catch (err) {
      log.addSkipped("wallet_totals", w._ID, err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 6. CONTRACTS
  // -----------------------------------------------------------------------
  console.log("[6/7] Migrando contracts...");
  const contracts = readJsonTable(srcDb, "contracts");

  const insertContract = destDb.prepare(`
    INSERT INTO contracts (id, casa_id, afiliado_id, tipo, valor, status, data_criacao, data_atualizacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of contracts) {
    if (!validateRequired(c, ["casaId", "afiliadoId"], "contracts")) continue;

    try {
      insertContract.run(
        String(c.id || c._ID),
        String(c.casaId),
        Number(c.afiliadoId),
        c.tipo || null,
        c.valor || null,
        c.status || "ativo",
        c.dataCriacao || new Date().toISOString(),
        c.dataAtualizacao || c.dataCriacao || new Date().toISOString(),
      );
      log.addInserted("contracts");
    } catch (err) {
      log.addSkipped("contracts", c._ID, err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 7. VALIDAÇÃO DE INTEGRIDADE
  // -----------------------------------------------------------------------
  console.log("[7/7] Validando integridade...");
  const integrity = destDb.pragma("integrity_check");
  console.log("  integrity_check:", integrity[0]?.integrity_check || "ok");

  const fkCheck = destDb.pragma("foreign_key_check");
  if (fkCheck.length === 0) {
    console.log("  foreign_key_check: ok (0 violacoes)");
  } else {
    console.log(`  foreign_key_check: ${fkCheck.length} VIOLACOES encontradas!`);
    for (const fk of fkCheck.slice(0, 20)) {
      console.log(`    Tabela=${fk.table}, rowid=${fk.rowid}, ref=${fk.parent}, fkid=${fk.fkid}`);
    }
  }
});

// Executar tudo dentro da transaction
try {
  migrate();
  console.log("\nMigracao concluida com sucesso!");
} catch (err) {
  console.error("\nERRO FATAL na migracao (rollback executado):");
  console.error(err.message);
  process.exit(1);
} finally {
  srcDb.close();
  destDb.close();
}

// Imprimir resumo
log.print();
