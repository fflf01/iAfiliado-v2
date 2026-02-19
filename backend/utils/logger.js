const isProduction = process.env.NODE_ENV === "production";
const LOG_LEVELS = ["debug", "info", "warn", "error"];

function resolveLogLevel() {
  const raw = String(process.env.LOG_LEVEL || "").toLowerCase().trim();
  if (!raw) return isProduction ? "info" : "debug";
  return LOG_LEVELS.includes(raw) ? raw : "info";
}

const activeLogLevel = resolveLogLevel();
const activeLogLevelWeight = LOG_LEVELS.indexOf(activeLogLevel);

function formatLog(level, message, meta = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (isProduction) {
    return JSON.stringify(payload);
  }

  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${payload.timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
}

function writeLog(level, message, meta = {}) {
  const levelWeight = LOG_LEVELS.indexOf(level);
  if (levelWeight < activeLogLevelWeight) {
    return;
  }

  const content = formatLog(level, message, meta);
  if (level === "error") {
    console.error(content);
    return;
  }
  if (level === "warn") {
    console.warn(content);
    return;
  }
  console.log(content);
}

function buildLogger(baseMeta = {}) {
  return {
    withContext(nextMeta = {}) {
      return buildLogger({ ...baseMeta, ...nextMeta });
    },
    debug(message, meta = {}) {
      if (isProduction) return;
      writeLog("debug", message, { ...baseMeta, ...meta });
    },
    info(message, meta = {}) {
      writeLog("info", message, { ...baseMeta, ...meta });
    },
    warn(message, meta = {}) {
      writeLog("warn", message, { ...baseMeta, ...meta });
    },
    error(message, meta = {}) {
      writeLog("error", message, { ...baseMeta, ...meta });
    },
  };
}

export const logger = buildLogger();
