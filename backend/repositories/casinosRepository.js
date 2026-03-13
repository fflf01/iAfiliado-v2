import db from "../db.js";

export const casinosRepository = {
  listActiveCasinos() {
    return db
      .prepare(
        `SELECT id, name, url, url_afiliado, comissao_cpa, comissao_revshare, comissao_depositoc, payment_type, status, description
         FROM casinos
         WHERE status = 'active'
         ORDER BY name ASC`,
      )
      .all();
  },
};

