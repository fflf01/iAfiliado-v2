import { dashboardService } from "../services/dashboardService.js";
import { adminRepository } from "../repositories/adminRepository.js";
import { ForbiddenError } from "../errors/AppError.js";

/**
 * GET /me/stats - Estatísticas agregadas do usuário (cliques, depósitos, comissão, FTDs).
 * Requer authMiddleware (req.user.id).
 */
export function getMyStats(req, res) {
  const stats = dashboardService.getMyStats(req.user.id, req.query);
  return res.json(stats);
}

/**
 * GET /me/wallet - Carteira do usuário (valor recebido, saldo, sacado).
 * Requer authMiddleware (req.user.id).
 */
export function getMyWallet(req, res) {
  const wallet = dashboardService.getMyWallet(req.user.id);
  return res.json(wallet);
}

/**
 * GET /me/casas - Casas/casinos vinculados ao usuário autenticado.
 * Requer authMiddleware (req.user.id).
 */
export function getMyCasas(req, res) {
  const casas = dashboardService.getMyCasas(req.user.id);
  return res.json(casas);
}

/**
 * GET /me/entradas - Lista entradas do usuário (query: fromMs, toMs opcionais).
 * Requer authMiddleware (req.user.id).
 */
export function getMyEntradas(req, res) {
  const list = dashboardService.getMyEntradas(req.user.id, req.query);
  return res.json(list);
}

/**
 * GET /me/managed-accounts - Contas que o manager pode visualizar/administrar.
 * Requer authMiddleware. Apenas usuários com is_manager podem acessar.
 */
export function getMyManagedAccounts(req, res) {
  if (!req.user?.is_manager) {
    throw new ForbiddenError("Acesso restrito a managers.");
  }
  const accounts = adminRepository.getManagedAccountsWithDetails(req.user.id);
  return res.json(accounts);
}
