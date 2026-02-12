/**
 * Autenticacao de usuario e perfil.
 * @module auth/login
 */

import bcrypt from "bcrypt";
import db from "../db.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Autentica por email ou username e senha. Compara senha com bcrypt e retorna JWT.
 * @param {import("express").Request} req - Body: email ou login, password
 * @param {import("express").Response} res - 200 { message, user, token } | 400 | 401
 */
export async function login(req, res) {
  const { email, login: loginField, password } = req.body;
  const identifier = email || loginField;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email/Login e senha sao obrigatorios." });
  }

  const user = db
    .prepare("SELECT id, username, full_name, email, phone, password_hash, is_admin FROM users WHERE email = ? OR username = ?")
    .get(identifier, identifier);

  if (!user) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

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
 * Retorna o perfil atualizado do usuario autenticado (dados frescos do DB).
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 200 { message, user } | 404
 */
export function getProfile(req, res) {
  const user = db
    .prepare("SELECT id, username, full_name, email, phone, is_admin FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuario nao encontrado." });
  }

  res.json({ message: "Usuario autenticado.", user });
}
