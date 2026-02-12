/**
 * Registro de novos clientes e listagem (admin).
 * @module auth/register
 */

import bcrypt from "bcrypt";
import db from "../db.js";
import { generateToken } from "../utils/jwt.js";
import { AUTH } from "../config/constants.js";

/**
 * Registra um novo usuario. Faz hash da senha, insere no banco e retorna JWT.
 * Validacao de campos e formato e feita pelo express-validator em routes.js.
 * Unicidade e garantida pela constraint UNIQUE (catch no errorHandler).
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 201 { message, user, token }
 */
export async function register(req, res) {
  const { name, login, email, password, phone, Tipo_Cliente, Tele_An, Rede_An } = req.body;

  // Validacao de forca da senha (complementar ao express-validator que valida tamanho)
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res
      .status(400)
      .json({ error: "A senha deve conter pelo menos uma letra e um numero." });
  }

  const hashedPassword = await bcrypt.hash(password, AUTH.SALT_ROUNDS);

  const result = db
    .prepare(
      `INSERT INTO users (username, full_name, email, password_hash, phone, tipo_cliente, tele_an, rede_an)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(login, name, email, hashedPassword, phone || null, Tipo_Cliente || null, Tele_An || null, Rede_An || null);

  const user = db
    .prepare("SELECT id, username, full_name, email, phone, is_admin FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  const token = generateToken(user);

  return res.status(201).json({
    message: "Usuario registrado com sucesso.",
    user,
    token,
  });
}

/**
 * Lista todos os clientes (admin).
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 200 array de clientes
 */
export function getClients(req, res) {
  const users = db
    .prepare("SELECT id, username, full_name, email, phone, is_admin FROM users ORDER BY id DESC")
    .all();
  res.json(users);
}
