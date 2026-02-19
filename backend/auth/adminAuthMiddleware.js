import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";

/**
 * Middleware que exige req.user.is_admin === true. Deve ser usado após authMiddleware.
 * Responde 401 se não autenticado, 403 se não for admin.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function adminAuthMiddleware(req, res, next) {
  const reqLogger = req.log;
  if (!req.user) {
    reqLogger?.warn("Autorizacao admin falhou: usuario nao autenticado");
    return next(new UnauthorizedError("Usuario nao autenticado."));
  }

  // Verifica a flag correta (is_admin) que vem do banco de dados/token
  if (!req.user.is_admin) {
    reqLogger?.warn("Autorizacao admin falhou: privilegios insuficientes", {
      userId: req.user.id,
    });
    return next(new ForbiddenError("Acesso negado. Requer privilegios de administrador."));
  }

  next();
}
