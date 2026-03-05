import bcrypt from "bcrypt";
import { AUTH } from "../config/constants.js";
import { generateToken } from "../utils/jwt.js";
import { authRepository } from "../repositories/authRepository.js";
import { resolvePagination } from "../utils/pagination.js";
import { loginAttemptsStore } from "../utils/loginAttemptsStore.js";
import { verifyRecaptcha, isCaptchaEnabled } from "../utils/captcha.js";
import { notifySuspiciousLoginAttempts } from "../utils/emailService.js";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  CaptchaRequiredError,
} from "../errors/AppError.js";

export const authService = {
  async login({ email, login, password, captchaToken }, { ip = null } = {}) {
    const identifier = email || login;

    if (!identifier || !password) {
      throw new ValidationError("Email/Login e senha sao obrigatorios.");
    }

    const user = authRepository.findByIdentifier(identifier);

    if (user) {
      if (user.is_blocked) {
        throw new ForbiddenError("Conta bloqueada. Contate o suporte.");
      }
      const lockedUntil = user.locked_until
        ? new Date(user.locked_until.replace(/(Z)?$/, "Z")).getTime()
        : null;
      if (lockedUntil && lockedUntil > Date.now()) {
        const minutesLeft = Math.ceil((lockedUntil - Date.now()) / 60000);
        throw new ForbiddenError(
          `Conta temporariamente bloqueada. Tente novamente em ${minutesLeft} minuto(s).`,
        );
      }
    }

    const isTest = process.env.NODE_ENV === "test";
    const ipAttempts = loginAttemptsStore.get(ip);
    if (!isTest && ipAttempts >= AUTH.CAPTCHA_AFTER_ATTEMPTS) {
      if (!captchaToken || typeof captchaToken !== "string" || !captchaToken.trim()) {
        throw new CaptchaRequiredError("Complete o CAPTCHA para continuar.");
      }
      const captchaOk = await verifyRecaptcha(captchaToken.trim(), ip);
      if (!captchaOk) {
        throw new ValidationError("CAPTCHA invalido. Tente novamente.");
      }
    }

    if (!user) {
      loginAttemptsStore.increment(ip);
      throw new UnauthorizedError("Credenciais invalidas.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const updated = authRepository.incrementFailedAttemptsAndMaybeLock(
        user.id,
        AUTH.LOCKOUT_AFTER_ATTEMPTS,
        AUTH.LOCKOUT_DURATION_MINUTES,
      );
      loginAttemptsStore.increment(ip);
      if (updated && updated.failed_login_attempts >= AUTH.LOCKOUT_AFTER_ATTEMPTS && updated.locked_until) {
        notifySuspiciousLoginAttempts(user.email, AUTH.LOCKOUT_DURATION_MINUTES).catch(() => {});
      }
      throw new UnauthorizedError("Credenciais invalidas.");
    }

    authRepository.resetFailedAttempts(user.id);
    loginAttemptsStore.reset(ip);

    const token = generateToken(user);
    delete user.password_hash;
    delete user.failed_login_attempts;
    delete user.locked_until;
    return { user, token };
  },

  async register(payload) {
    if (isCaptchaEnabled()) {
      const token =
        payload.captchaToken && typeof payload.captchaToken === "string"
          ? payload.captchaToken.trim()
          : "";
      if (!token) {
        throw new ValidationError("Complete o CAPTCHA para continuar.");
      }
      const captchaOk = await verifyRecaptcha(token);
      if (!captchaOk) {
        throw new ValidationError("CAPTCHA invalido. Tente novamente.");
      }
    } else if (payload.captchaToken && typeof payload.captchaToken === "string" && payload.captchaToken.trim()) {
      const captchaOk = await verifyRecaptcha(payload.captchaToken.trim());
      if (!captchaOk) {
        throw new ValidationError("CAPTCHA invalido. Tente novamente.");
      }
    }

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
