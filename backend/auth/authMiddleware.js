import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/AppError.js";

/**
 * Middleware que exige header Authorization: Bearer <token>. Verifica o JWT com JWT_SECRET
 * e popula req.user (e req.userId). Responde 401 se token ausente ou inválido.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function authMiddleware(req, res, next) {
  const reqLogger = req.log;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    reqLogger?.warn("Autenticacao falhou: token ausente");
    return next(new UnauthorizedError("Token nao fornecido."));
  }

  // Espera formato "Bearer <token>"
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    reqLogger?.warn("Autenticacao falhou: formato de token invalido", {
      authorizationHeaderLength: authHeader.length,
    });
    return next(new UnauthorizedError("Erro no formato do token."));
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    reqLogger?.warn("Autenticacao falhou: esquema invalido", { scheme });
    return next(new UnauthorizedError("Token malformatado."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, is_admin }
    req.userId = decoded.id; // Compatibilidade
    req.log = reqLogger?.withContext({
      userId: decoded.id,
      userIsAdmin: Boolean(decoded.is_admin),
    });
    next();
  } catch {
    reqLogger?.warn("Autenticacao falhou: token invalido ou expirado");
    return next(new UnauthorizedError("Token invalido ou expirado."));
  }
}
