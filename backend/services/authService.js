import bcrypt from "bcrypt";
import { AUTH } from "../config/constants.js";
import { generateToken } from "../utils/jwt.js";
import { authRepository } from "../repositories/authRepository.js";
import { resolvePagination } from "../utils/pagination.js";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../errors/AppError.js";

export const authService = {
  async login({ email, login, password }) {
    const identifier = email || login;

    if (!identifier || !password) {
      throw new ValidationError("Email/Login e senha sao obrigatorios.");
    }

    const user = authRepository.findByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedError("Credenciais invalidas.");
    }

    if (user.is_blocked) {
      // Não revela detalhes; apenas bloqueia o acesso.
      throw new ForbiddenError("Conta bloqueada. Contate o suporte.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError("Credenciais invalidas.");
    }

    const token = generateToken(user);
    delete user.password_hash;
    return { user, token };
  },

  async register(payload) {
    if (!/[a-zA-Z]/.test(payload.password) || !/[0-9]/.test(payload.password)) {
      throw new ValidationError(
        "A senha deve conter pelo menos uma letra e um numero.",
      );
    }

    const rawCpfCnpj = payload.cpfCnpj ?? payload.cpf_cnpj;
    const cpfCnpj = String(rawCpfCnpj || "").replace(/\D/g, "");
    if (!cpfCnpj) {
      throw new ValidationError("CPF/CNPJ e obrigatorio.");
    }
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      throw new ValidationError("CPF/CNPJ invalido.");
    }

    const passwordHash = await bcrypt.hash(payload.password, AUTH.SALT_ROUNDS);
    const user = authRepository.insertUser({
      ...payload,
      passwordHash,
      cpfCnpj,
      tipoCliente: payload.Tipo_Cliente,
      teleAn: payload.Tele_An,
      redeAn: payload.Rede_An,
    });

    const token = generateToken(user);
    return { user, token };
  },

  getProfile(userId) {
    const user = authRepository.findPublicById(userId);
    if (!user) throw new NotFoundError("Usuario nao encontrado.");
    return user;
  },

  listClients(query = {}) {
    const pagination = resolvePagination(query);
    return authRepository.listClients(pagination);
  },
};
