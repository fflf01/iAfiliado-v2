/**
 * Constantes centralizadas da aplicacao.
 * Evita magic numbers e strings hardcoded espalhados pelo codigo.
 * @module config/constants
 */

/** 1 dia em segundos (para cookie maxAge). */
const ONE_DAY_S = 24 * 60 * 60;

export const AUTH = {
  SALT_ROUNDS: 10,
  TOKEN_EXPIRY: "1d",
  MIN_PASSWORD_LENGTH: 8,
  /** Nome do cookie HttpOnly que armazena o JWT. */
  COOKIE_NAME: "auth_token",
  /** Opcoes do cookie: HttpOnly, Secure (prod), SameSite=Strict. */
  COOKIE_OPTIONS: (secure = false) => ({
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: ONE_DAY_S * 1000,
    path: "/",
  }),
  /** Apos quantas falhas de login (por IP) exige CAPTCHA. */
  CAPTCHA_AFTER_ATTEMPTS: 3,
  /** Apos quantas falhas de login (por conta) bloqueia a conta temporariamente. */
  LOCKOUT_AFTER_ATTEMPTS: 5,
  /** Duracao do bloqueio temporario em minutos. */
  LOCKOUT_DURATION_MINUTES: 15,
  /** Janela em ms para contagem de tentativas por IP (igual ao rate limit). */
  IP_ATTEMPTS_WINDOW_MS: 15 * 60 * 1000,
};

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_EXTENSIONS_BY_MIME: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
  },
  ALLOWED_MIMES: new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
};

export const TICKET = {
  PREFIX: "SUP-",
  VIP_TYPES: ["vip", "gestor_vip", "gestor_afiliados", "influencer"],
  PRIORITIES: { HIGH: "high", MEDIUM: "medium", LOW: "low" },
  STATUSES: {
    OPEN: "aberto",
    IN_PROGRESS: "em_andamento",
    RESOLVED: "resolvido",
  },
};

export const RATE_LIMIT = {
  GLOBAL: { WINDOW_MS: 15 * 60 * 1000, MAX: 400 },
  AUTH: { WINDOW_MS: 15 * 60 * 1000, MAX: 5 },
  SUPPORT: { WINDOW_MS: 15 * 60 * 1000, MAX: 20 },
};

export const VALIDATION = {
  MESSAGE_MAX_LENGTH: 2000,
  SUBJECT_MAX_LENGTH: 200,
  NAME_MAX_LENGTH: 120,
};
