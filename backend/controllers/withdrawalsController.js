import { withdrawalsService } from "../services/withdrawalsService.js";

// POST /me/withdrawals - usuário solicita saque
export function createWithdrawal(req, res) {
  const out = withdrawalsService.createRequest(req.user.id, req.body);
  return res.status(201).json(out);
}

// GET /me/withdrawals - lista solicitações do usuário (opcional)
export function listMyWithdrawals(req, res) {
  return res.json(withdrawalsService.listByUser(req.user.id));
}

// GET /admin/withdrawals - admin lista todas as solicitações
export function listWithdrawalsAdmin(req, res) {
  return res.json(withdrawalsService.listForAdmin(req.query));
}

// PUT /admin/withdrawals/:id/status - admin aprova ou rejeita
export function updateWithdrawalStatus(req, res) {
  return res.json(withdrawalsService.updateStatus(req.params.id, req.body));
}
