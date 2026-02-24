import { dashboardService } from "../services/dashboardService.js";
import { authService } from "../services/authService.js";
import { ValidationError } from "../errors/AppError.js";

function parseUserId(raw) {
  const id = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("ID do usuario invalido.");
  }
  return id;
}

// Admin-only endpoints para visualizar dados do dashboard de qualquer usuario.
export function getUserProfile(req, res) {
  const userId = parseUserId(req.params.id);
  const user = authService.getProfile(userId);
  return res.json({ message: "Usuario encontrado.", user });
}

export function getUserStats(req, res) {
  const userId = parseUserId(req.params.id);
  const stats = dashboardService.getMyStats(userId, req.query);
  return res.json(stats);
}

export function getUserWallet(req, res) {
  const userId = parseUserId(req.params.id);
  const wallet = dashboardService.getMyWallet(userId);
  return res.json(wallet);
}

export function getUserCasas(req, res) {
  const userId = parseUserId(req.params.id);
  const casas = dashboardService.getMyCasas(userId);
  return res.json(casas);
}

export function getUserEntradas(req, res) {
  const userId = parseUserId(req.params.id);
  const list = dashboardService.getMyEntradas(userId, req.query);
  return res.json(list);
}

