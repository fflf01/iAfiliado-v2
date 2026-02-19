/**
 * Constantes centralizadas da aplicacao.
 * Evita magic numbers e strings hardcoded espalhados pelo codigo.
 * @module config/constants
 */

export const AUTH = {
  SALT_ROUNDS: 10,
  TOKEN_EXPIRY: "1d",
  MIN_PASSWORD_LENGTH: 8,
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
  GLOBAL: { WINDOW_MS: 15 * 60 * 1000, MAX: 100 },
  AUTH: { WINDOW_MS: 15 * 60 * 1000, MAX: 10 },
  SUPPORT: { WINDOW_MS: 15 * 60 * 1000, MAX: 20 },
};

export const VALIDATION = {
  MESSAGE_MAX_LENGTH: 2000,
  SUBJECT_MAX_LENGTH: 200,
  NAME_MAX_LENGTH: 120,
};
