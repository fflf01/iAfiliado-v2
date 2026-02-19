import { AppError } from "../errors/AppError.js";

const ALLOWED_NODE_ENVS = new Set(["development", "test", "production"]);
const ALLOWED_LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);

function parseCorsOrigins(value) {
  const origins = (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new AppError(`CORS_ORIGINS contem URL invalida: ${origin}`, 500, "ENV_INVALID");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new AppError(
        `CORS_ORIGINS aceita apenas http/https: ${origin}`,
        500,
        "ENV_INVALID",
      );
    }
  }

  return origins;
}

function parsePort(value) {
  if (!value) return 3000;
  const port = Number.parseInt(String(value), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AppError("PORT deve ser um inteiro entre 1 e 65535.", 500, "ENV_INVALID");
  }
  return port;
}

function parseLogLevel(value) {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  if (!ALLOWED_LOG_LEVELS.has(normalized)) {
    throw new AppError(
      `LOG_LEVEL invalido: ${value}. Use debug, info, warn ou error.`,
      500,
      "ENV_INVALID",
    );
  }
  return normalized;
}

function parseOptionalDiscordWebhook(value) {
  if (!value) return null;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new AppError("DISCORD_WEBHOOK_URL deve ser uma URL valida.", 500, "ENV_INVALID");
  }

  if (parsed.protocol !== "https:") {
    throw new AppError("DISCORD_WEBHOOK_URL deve usar https.", 500, "ENV_INVALID");
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith("discord.com") && !host.endsWith("discordapp.com")) {
    throw new AppError(
      "DISCORD_WEBHOOK_URL deve apontar para dominio do Discord.",
      500,
      "ENV_INVALID",
    );
  }

  return value;
}

function parseDbPath(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) {
    throw new AppError("DB_PATH nao pode ser vazio.", 500, "ENV_INVALID");
  }
  return normalized;
}

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  if (!ALLOWED_NODE_ENVS.has(nodeEnv)) {
    throw new AppError(
      `NODE_ENV invalido: ${nodeEnv}. Use development, test ou production.`,
      500,
      "ENV_INVALID",
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET nao definido. Configure no ambiente.", 500, "ENV_MISSING");
  }

  if (nodeEnv === "production" && process.env.JWT_SECRET.length < 32) {
    throw new AppError(
      "JWT_SECRET muito curto para producao. Use no minimo 32 caracteres.",
      500,
      "ENV_WEAK",
    );
  }

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  if (nodeEnv === "production" && corsOrigins.length === 0) {
    throw new AppError(
      "CORS_ORIGINS deve ser definido em producao com ao menos uma origem valida.",
      500,
      "ENV_MISSING",
    );
  }

  return {
    nodeEnv,
    isProduction: nodeEnv === "production",
    corsOrigins,
    port: parsePort(process.env.PORT),
    dbPath: parseDbPath(process.env.DB_PATH),
    discordWebhookUrl: parseOptionalDiscordWebhook(process.env.DISCORD_WEBHOOK_URL),
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
  };
}
