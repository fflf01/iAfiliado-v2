/**
 * Utilitario para geracao de tokens JWT.
 * Centraliza a logica que antes estava duplicada em login.js e register.js.
 * @module utils/jwt
 */

import jwt from "jsonwebtoken";
import { AUTH } from "../config/constants.js";

/**
 * Gera um token JWT com os dados essenciais do usuario.
 * @param {{ id: number, name: string, email: string, is_admin: boolean }} user
 * @returns {string} Token JWT assinado
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
    },
    process.env.JWT_SECRET,
    { expiresIn: AUTH.TOKEN_EXPIRY }
  );
}
