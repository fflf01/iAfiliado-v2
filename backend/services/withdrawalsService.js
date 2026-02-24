import crypto from "crypto";
import { ValidationError, NotFoundError, AppError } from "../errors/AppError.js";
import { withdrawalsRepository } from "../repositories/withdrawalsRepository.js";

const MIN_VALOR = 50;

export const withdrawalsService = {
  createRequest(userId, payload) {
    const valor = Number(payload?.valor);
    if (!Number.isFinite(valor) || valor < MIN_VALOR) {
      throw new ValidationError(`Valor mínimo para saque é R$ ${MIN_VALOR},00.`);
    }
    const metodo = String(payload?.metodo || "PIX").trim() || "PIX";

    const wallet = withdrawalsRepository.getWalletByUserId(userId);
    const saldo = wallet ? Number(wallet.saldo_disponivel) || 0 : 0;
    if (saldo < valor) {
      throw new AppError("Saldo insuficiente para este saque.", 400, "INSUFFICIENT_BALANCE");
    }

    const id = crypto.randomUUID();
    withdrawalsRepository.insert(userId, { id, valor, metodo });
    const row = withdrawalsRepository.findById(id);
    return {
      id: row.id,
      valor: row.valor,
      metodo: row.metodo,
      status: row.status,
      createdAt: row.created_at,
    };
  },

  listForAdmin(query = {}) {
    const status = typeof query.status === "string" && query.status.trim()
      ? query.status.trim().toLowerCase()
      : null;
    if (status && !["pendente", "aprovado", "rejeitado"].includes(status)) {
      return withdrawalsRepository.listForAdmin(null);
    }
    return withdrawalsRepository.listForAdmin(status);
  },

  updateStatus(id, payload) {
    const reqId = String(id || "").trim();
    if (!reqId) throw new ValidationError("ID da solicitação inválido.");

    const status = String(payload?.status || "").trim().toLowerCase();
    if (!["aprovado", "rejeitado"].includes(status)) {
      throw new ValidationError("Status inválido. Use aprovado ou rejeitado.");
    }

    const row = withdrawalsRepository.findById(reqId);
    if (!row) throw new NotFoundError("Solicitação de saque não encontrada.");
    if (row.status !== "pendente") {
      throw new ValidationError("Esta solicitação já foi processada.");
    }

    if (status === "aprovado") {
      const wallet = withdrawalsRepository.getWalletByUserId(row.user_id);
      const saldo = wallet ? Number(wallet.saldo_disponivel) || 0 : 0;
      if (saldo < row.valor) {
        throw new AppError("Saldo insuficiente do usuário para aprovar este saque.", 400, "INSUFFICIENT_BALANCE");
      }
      const up = withdrawalsRepository.updateWalletOnApproval(row.user_id, row.valor);
      if (up.changes === 0) {
        throw new AppError("Não foi possível atualizar a carteira do usuário.", 500, "WALLET_UPDATE_FAILED");
      }
    }

    withdrawalsRepository.updateStatus(reqId, status);
    return { ok: true };
  },

  listByUser(userId) {
    return withdrawalsRepository.listByUser(userId);
  },
};
