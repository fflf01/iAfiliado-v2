import db from "../db.js";
import { ADMIN_DEFAULT_LIMIT, ADMIN_MAX_LIMIT } from "../utils/pagination.js";

function clampAdminLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 1) return ADMIN_DEFAULT_LIMIT;
  return Math.min(n, ADMIN_MAX_LIMIT);
}

export const contractsRepository = {
  findCasinoByName(name) {
    const normalized = String(name || "").trim().toLowerCase();
    if (!normalized) return null;
    const byName =
      db
        .prepare("SELECT id, name FROM casinos WHERE lower(name) = ? LIMIT 1")
        .get(normalized) || null;
    if (byName) return byName;

    // Fallback: tenta por id "slug" (ex.: betsul, betmgmpro)
    const slug = normalized.replace(/[^a-z0-9]/g, "");
    if (!slug) return null;
    return db.prepare("SELECT id, name FROM casinos WHERE id = ? LIMIT 1").get(slug) || null;
  },

  countPendingByAffiliateAndCasa(afiliadoId, casaId) {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS total FROM contracts WHERE afiliado_id = ? AND casa_id = ? AND status = 'pendente'`,
      )
      .get(afiliadoId, casaId);
    return Number(row?.total ?? 0);
  },

  findExistingContract({ afiliadoId, casaId }) {
    return (
      db
        .prepare(
          `SELECT id, status
           FROM contracts
           WHERE afiliado_id = ?
             AND casa_id = ?
             AND status IN ('pendente', 'ativo')
           ORDER BY data_criacao DESC
           LIMIT 1`,
        )
        .get(afiliadoId, casaId) || null
    );
  },

  insertContract({ id, casaId, afiliadoId, tipo, valor, status }) {
    db.prepare(
      `INSERT INTO contracts (id, casa_id, afiliado_id, tipo, valor, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      casaId,
      afiliadoId,
      tipo || null,
      valor || null,
      status || "pendente",
    );
    return (
      db.prepare("SELECT * FROM contracts WHERE id = ?").get(id) || null
    );
  },

  listContractsByStatus(status, { limit, offset } = {}) {
    const safeLimit = clampAdminLimit(limit ?? ADMIN_DEFAULT_LIMIT);
    const safeOffset = Math.max(0, Number(offset) || 0);
    return db
      .prepare(
        `SELECT
           ct.id,
           ct.status,
           ct.tipo,
           ct.valor,
           ct.data_criacao,
           ct.data_atualizacao,
           u.id AS afiliado_id,
           u.full_name AS afiliado_nome,
           u.email AS afiliado_email,
           u.phone AS afiliado_phone,
           c.id AS casa_id,
           c.name AS casa_nome
         FROM contracts ct
         JOIN users u ON u.id = ct.afiliado_id
         JOIN casinos c ON c.id = ct.casa_id
         WHERE ct.status = ?
         ORDER BY ct.data_criacao DESC
         LIMIT ? OFFSET ?`,
      )
      .all(status, safeLimit, safeOffset);
  },

  listAllContracts({ limit, offset } = {}) {
    const safeLimit = clampAdminLimit(limit ?? ADMIN_MAX_LIMIT);
    const safeOffset = Math.max(0, Number(offset) || 0);
    return db
      .prepare(
        `SELECT
           ct.id,
           ct.status,
           ct.tipo,
           ct.valor,
           ct.data_criacao,
           ct.data_atualizacao,
           u.id AS afiliado_id,
           u.full_name AS afiliado_nome,
           u.email AS afiliado_email,
           u.phone AS afiliado_phone,
           c.id AS casa_id,
           c.name AS casa_nome,
           (SELECT CASE WHEN EXISTS (
             SELECT 1 FROM affiliate_casinos ac
             WHERE ac.user_id = ct.afiliado_id AND ac.casino_id = ct.casa_id AND ac.status = 'active'
           ) THEN 1 ELSE 0 END) AS link_ativo
         FROM contracts ct
         JOIN users u ON u.id = ct.afiliado_id
         JOIN casinos c ON c.id = ct.casa_id
         WHERE ct.status IN ('pendente', 'aprovado', 'rejeitado')
         ORDER BY ct.data_criacao DESC
         LIMIT ? OFFSET ?`,
      )
      .all(safeLimit, safeOffset);
  },

  updateAffiliateCasinoLinkStatus(userId, casinoId, status) {
    const result = db
      .prepare(
        `UPDATE affiliate_casinos SET status = ? WHERE user_id = ? AND casino_id = ?`,
      )
      .run(status, userId, casinoId);
    return { changes: result.changes };
  },

  updateContractStatus(contractId, status) {
    const result = db
      .prepare(
        `UPDATE contracts
         SET status = ?,
             data_atualizacao = datetime('now')
         WHERE id = ?`,
      )
      .run(status, contractId);
    return { changes: result.changes };
  },

  findContractById(contractId) {
    return (
      db
        .prepare("SELECT * FROM contracts WHERE id = ?")
        .get(contractId) || null
    );
  },

  findAffiliateCasinoLink({ userId, casinoId }) {
    return (
      db
        .prepare(
          `SELECT id, status
           FROM affiliate_casinos
           WHERE user_id = ? AND casino_id = ?
           LIMIT 1`,
        )
        .get(userId, casinoId) || null
    );
  },

  insertAffiliateCasinoLink({ id, userId, casinoId, status, link }) {
    db.prepare(
      `INSERT INTO affiliate_casinos (id, user_id, casino_id, status, link)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, userId, casinoId, status || "active", link || null);
  },

  updateAffiliateCasinoLink({ userId, casinoId, link }) {
    return db
      .prepare(`UPDATE affiliate_casinos SET link = ? WHERE user_id = ? AND casino_id = ?`)
      .run(link || null, userId, casinoId);
  },
};

