/**
 * Autenticacao de usuario e perfil.
 * @module auth/login
 */

import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Autentica por email ou login e senha. Compara senha com bcrypt e retorna JWT.
 * @param {import("express").Request} req - Body: email ou login, password
 * @param {import("express").Response} res - 200 { message, user, token } | 400 | 401
 */
export async function login(req, res) {
  const { email, login: loginField, password } = req.body;
  const identifier = email || loginField;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email/Login e senha sao obrigatorios." });
  }

  const result = await pool.query(
    "SELECT id, name, login, email, phone, password_hash, is_admin FROM clients WHERE email = $1 OR login = $1",
    [identifier]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  const token = generateToken(user);

  // Remove a senha do objeto retornado
  delete user.password_hash;

  return res.json({ message: "Login realizado com sucesso.", user, token });
}

/**
 * Retorna o usuario autenticado (payload do JWT em req.user).
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 200 { message, user }
 */
export function getProfile(req, res) {
  res.json({ message: "Usuario autenticado.", user: req.user });
}
