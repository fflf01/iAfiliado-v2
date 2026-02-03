/**
 * Middleware que exige req.user.is_admin === true. Deve ser usado após authMiddleware.
 * Responde 401 se não autenticado, 403 se não for admin.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function adminAuthMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  // Verifica a flag correta (is_admin) que vem do banco de dados/token
  if (!req.user.is_admin) {
    return res
      .status(403)
      .json({ error: "Acesso negado. Requer privilégios de administrador." });
  }

  next();
}
