import { dashboardService } from "../services/dashboardService.js";

/**
 * GET /me/stats - Estatísticas agregadas do usuário (cliques, depósitos, comissão, FTDs).
 * Requer authMiddleware (req.user.id).
 */
export function getMyStats(req, res) {
  const stats = dashboardService.getMyStats(req.user.id);
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
 * GET /me/entradas - Lista entradas do usuário (query: fromMs, toMs opcionais).
 * Requer authMiddleware (req.user.id).
 */
export function getMyEntradas(req, res) {
  const list = dashboardService.getMyEntradas(req.user.id, req.query);
  return res.json(list);
}
