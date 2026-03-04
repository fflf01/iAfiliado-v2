import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { authRepository } from "../repositories/authRepository.js";
import { AUTH } from "../config/constants.js";

/**
 * Obtém o token JWT do request: primeiro do cookie HttpOnly (auth_token),
 * depois do header Authorization: Bearer (para clientes não-browser / testes).
 */
function getTokenFromRequest(req) {
  const fromCookie = req.cookies?.[AUTH.COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) return null;
  return parts[1];
}

/**
 * Middleware que exige token JWT (cookie HttpOnly ou Authorization: Bearer).
 * Verifica o JWT com JWT_SECRET e popula req.user (e req.userId). Responde 401 se token ausente ou inválido.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function authMiddleware(req, res, next) {
  const reqLogger = req.log;
  const token = getTokenFromRequest(req);

  if (!token) {
    reqLogger?.warn("Autenticacao falhou: token ausente");
    return next(new UnauthorizedError("Token nao fornecido."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Bloqueio administrativo: aplica imediatamente, mesmo com token antigo.
    const status = authRepository.findAuthStatusById(decoded.id);
    if (status?.is_blocked) {
      reqLogger?.warn("Autenticacao falhou: usuario bloqueado", { userId: decoded.id });
      return next(new ForbiddenError("Conta bloqueada."));
    }

    req.user = decoded; // { id, email, is_admin, is_support, is_manager }
    req.userId = decoded.id;
    req.log = reqLogger?.withContext({
      userId: decoded.id,
      userIsAdmin: Boolean(decoded.is_admin),
      userIsSupport: Boolean(decoded.is_support),
      userIsManager: Boolean(decoded.is_manager),
    });
    next();
  } catch {
    reqLogger?.warn("Autenticacao falhou: token invalido ou expirado");
    return next(new UnauthorizedError("Token invalido ou expirado."));
  }
}
