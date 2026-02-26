import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";

/**
 * Middleware que exige acesso ao painel admin.
 * Permite acesso para roles admin_ceo (is_admin) e support (is_support).
 * Deve ser usado após authMiddleware.
 */
export function adminAuthMiddleware(req, res, next) {
  const reqLogger = req.log;
  if (!req.user) {
    reqLogger?.warn("Autorizacao admin falhou: usuario nao autenticado");
    return next(new UnauthorizedError("Usuario nao autenticado."));
  }

  if (!req.user.is_admin && !req.user.is_support) {
    reqLogger?.warn("Autorizacao admin falhou: privilegios insuficientes", {
      userId: req.user.id,
    });
    return next(new ForbiddenError("Acesso negado. Requer privilegios de administrador."));
  }

  next();
}
