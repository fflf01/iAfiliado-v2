import { authService } from "../services/authService.js";

export async function register(req, res) {
  const { user, token } = await authService.register(req.body);
  return res.status(201).json({
    message: "Usuario registrado com sucesso.",
    user,
    token,
  });
}

export async function login(req, res) {
  const { user, token } = await authService.login(req.body);
  return res.json({ message: "Login realizado com sucesso.", user, token });
}

export function getProfile(req, res) {
  const user = authService.getProfile(req.user.id);
  return res.json({ message: "Usuario autenticado.", user });
}

export function getClients(req, res) {
  const users = authService.listClients();
  return res.json(users);
}
