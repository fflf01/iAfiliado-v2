import { authService } from "../services/authService.js";
import { AUTH } from "../config/constants.js";

const isProduction = process.env.NODE_ENV === "production";

function setAuthCookie(res, token) {
  res.cookie(AUTH.COOKIE_NAME, token, AUTH.COOKIE_OPTIONS(isProduction));
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH.COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
  });
}

export async function register(req, res) {
  const { user, token } = await authService.register(req.body);
  setAuthCookie(res, token);
  return res.status(201).json({
    message: "Usuario registrado com sucesso.",
    user,
    token,
  });
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

export async function login(req, res) {
  const ip = getClientIp(req);
  const { user, token } = await authService.login(req.body, { ip });
  setAuthCookie(res, token);
  return res.json({ message: "Login realizado com sucesso.", user, token });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  return res.status(204).send();
}

export function getProfile(req, res) {
  const user = authService.getProfile(req.user.id);
  return res.json({ message: "Usuario autenticado.", user });
}

export function getClients(req, res) {
  const users = authService.listClients(req.query);
  return res.json(users);
}
