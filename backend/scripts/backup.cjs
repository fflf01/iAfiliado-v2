/**
 * Script de backup do banco SQLite.
 * Cria uma copia segura usando a API de backup do better-sqlite3
 * (compativel com WAL — nao bloqueia leituras/escritas durante o backup).
 *
 * Uso:
 *   node backend/scripts/backup.cjs [diretorio-destino] [--max=N]
 *
 * Opcoes:
 *   diretorio-destino   Caminho para salvar backups (default: backend/data/backups/)
 *   --max=N             Quantidade maxima de backups a manter (default: 10)
 *
 * O arquivo gerado tem o formato: iafiliado_YYYYMMDD_HHmmss.db
 *
 * Para agendar via cron (Linux):
 *   0 3 * * * cd /app && node scripts/backup.cjs >> /var/log/backup.log 2>&1
 *
 * Para agendar via Task Scheduler (Windows):
 *   node "C:\caminho\backend\scripts\backup.cjs"
 */

"use strict";

const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Configuracao
// ---------------------------------------------------------------------------
const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, "..", process.env.DB_PATH)
  : path.join(__dirname, "..", "data", "iafiliado.db");

// Primeiro argumento posicional (que nao comeca com --) e o diretorio destino
const positionalArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const BACKUP_DIR = positionalArgs[0] || path.join(__dirname, "..", "data", "backups");

// --max=N define quantos backups manter (default: 10)
const maxFlag = process.argv.find((a) => a.startsWith("--max="));
const MAX_BACKUPS = maxFlag ? parseInt(maxFlag.split("=")[1], 10) || 10 : 10;

// ---------------------------------------------------------------------------
// Validacoes
// ---------------------------------------------------------------------------
if (!fs.existsSync(DB_PATH)) {
  console.error(`[ERRO] Banco nao encontrado: ${DB_PATH}`);
  process.exit(1);
}

// Garante que o diretorio de backup existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Gera nome do backup com timestamp (YYYYMMDD_HHmmss)
// ---------------------------------------------------------------------------
function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${M}${d}_${h}${m}${s}`;
}

const timestamp = formatTimestamp(new Date());
const backupName = `iafiliado_${timestamp}.db`;
const backupPath = path.join(BACKUP_DIR, backupName);

// Evita sobrescrever backup existente (ex: execucao duplicada no mesmo segundo)
if (fs.existsSync(backupPath)) {
  console.error(`[ERRO] Backup ja existe: ${backupPath}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Executa o backup via API nativa do better-sqlite3
// ---------------------------------------------------------------------------
const Database = require("better-sqlite3");
const db = new Database(DB_PATH, { readonly: true });

console.log(`[BACKUP] Iniciando backup de: ${DB_PATH}`);
console.log(`[BACKUP] Destino: ${backupPath}`);

db.backup(backupPath)
  .then(() => {
    db.close();

    // Tamanho do arquivo gerado
    const sizeBytes = fs.statSync(backupPath).size;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

    // Verificacao de integridade no backup
    const backupDb = new Database(backupPath, { readonly: true });
    let integrityOk = false;
    try {
      const result = backupDb.pragma("integrity_check");
      const status = result[0]?.integrity_check || "ok";
      integrityOk = status === "ok";
      if (!integrityOk) {
        console.error(`[AVISO] Integrity check falhou: ${status}`);
      }
    } finally {
      backupDb.close();
    }

    console.log(
      `[BACKUP] Concluido: ${backupName} (${sizeMB} MB)` +
        (integrityOk ? " — integridade OK" : " — INTEGRIDADE FALHOU")
    );

    // -----------------------------------------------------------------
    // Rotacao: remove backups antigos alem do limite
    // -----------------------------------------------------------------
    const backups = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("iafiliado_") && f.endsWith(".db"))
      .sort()
      .reverse(); // mais recente primeiro

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);
      for (const old of toDelete) {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, old));
          console.log(`[BACKUP] Backup antigo removido: ${old}`);
        } catch (err) {
          console.error(`[AVISO] Falha ao remover ${old}: ${err.message}`);
        }
      }
    }

    console.log(
      `[BACKUP] Backups mantidos: ${Math.min(backups.length, MAX_BACKUPS)}/${MAX_BACKUPS}`
    );
  })
  .catch((err) => {
    db.close();
    // Remove arquivo parcial se existir
    if (fs.existsSync(backupPath)) {
      try {
        fs.unlinkSync(backupPath);
      } catch {
        // ignora erro na limpeza
      }
    }
    console.error(`[ERRO] Falha ao criar backup: ${err.message}`);
    process.exit(1);
  });
