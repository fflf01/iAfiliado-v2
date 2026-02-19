/**
 * Middleware centralizado de tratamento de erros.
 * asyncHandler elimina try-catch repetitivos nos route handlers.
 * errorHandler trata erros conhecidos (SQLite, Multer) e retorna respostas seguras.
 * @module middleware/errorHandler
 */

import multer from "multer";
import { AppError } from "../errors/AppError.js";
import { logger } from "../utils/logger.js";

const isProduction = process.env.NODE_ENV === "production";

function sendError(res, req, { status, code, message }) {
  return res.status(status).json({
    error: message,
    code,
    requestId: req.requestId || null,
  });
}

function logHandledError(reqLogger, { level = "warn", event, status, code, message, details }) {
  reqLogger[level](event, {
    status,
    code,
    error: message,
    details: details || undefined,
  });
}

/**
 * Wrapper para route handlers async. Captura rejeicoes e repassa para o error handler.
 * @param {Function} fn - Route handler async (req, res, next) => Promise
 * @returns {Function} Route handler com catch automatico
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handler centralizado. Deve ser registrado como ultimo middleware no Express.
 * Trata erros conhecidos com respostas amigaveis; oculta detalhes em producao.
 */
export function errorHandler(err, req, res, _next) {
  const reqLogger = req.log || logger.withContext({ requestId: req.requestId });

  if (err instanceof AppError) {
    logHandledError(reqLogger, {
      level: err.status >= 500 ? "error" : "warn",
      event: "Erro de aplicacao",
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return sendError(res, req, {
      status: err.status,
      code: err.code,
      message: err.message,
    });
  }

  // Erros do Multer (upload de arquivos)
  if (err instanceof multer.MulterError) {
    const multerMessages = {
      LIMIT_FILE_SIZE: "Arquivo excede o tamanho maximo permitido.",
      LIMIT_FILE_COUNT: "Limite de arquivos excedido.",
      LIMIT_UNEXPECTED_FILE: "Campo de arquivo inesperado.",
    };
    const message = multerMessages[err.code] || "Erro no upload de arquivo.";
    logHandledError(reqLogger, {
      event: "Erro de upload (multer)",
      status: 400,
      code: "UPLOAD_ERROR",
      message,
      details: { multerCode: err.code },
    });
    return sendError(res, req, {
      status: 400,
      code: "UPLOAD_ERROR",
      message,
    });
  }

  // Erro de tipo de arquivo (lançado pelo fileFilter do Multer)
  if (err?.message === "Tipo de arquivo não permitido") {
    logHandledError(reqLogger, {
      event: "Erro de upload (tipo de arquivo)",
      status: 400,
      code: "UPLOAD_FILETYPE",
      message: "Tipo de arquivo nao permitido.",
    });
    return sendError(res, req, {
      status: 400,
      code: "UPLOAD_FILETYPE",
      message: "Tipo de arquivo nao permitido.",
    });
  }

  if (err?.message === "Extensao de arquivo invalida para o MIME informado") {
    logHandledError(reqLogger, {
      event: "Erro de upload (extensao x MIME)",
      status: 400,
      code: "UPLOAD_EXTENSION_MISMATCH",
      message: "Extensao de arquivo invalida para o MIME informado.",
    });
    return sendError(res, req, {
      status: 400,
      code: "UPLOAD_EXTENSION_MISMATCH",
      message: "Extensao de arquivo invalida para o MIME informado.",
    });
  }

  // Violacao de unicidade do SQLite (email/username duplicado)
  if (err.message && err.message.includes("UNIQUE constraint failed")) {
    if (err.message.includes("email")) {
      logHandledError(reqLogger, {
        event: "Conflito de unicidade (email)",
        status: 409,
        code: "EMAIL_ALREADY_EXISTS",
        message: "Este e-mail ja esta em uso.",
      });
      return sendError(res, req, {
        status: 409,
        code: "EMAIL_ALREADY_EXISTS",
        message: "Este e-mail ja esta em uso.",
      });
    }
    if (err.message.includes("username")) {
      logHandledError(reqLogger, {
        event: "Conflito de unicidade (username)",
        status: 409,
        code: "USERNAME_ALREADY_EXISTS",
        message: "Este login ja esta em uso.",
      });
      return sendError(res, req, {
        status: 409,
        code: "USERNAME_ALREADY_EXISTS",
        message: "Este login ja esta em uso.",
      });
    }
    logHandledError(reqLogger, {
      event: "Conflito de unicidade",
      status: 409,
      code: "DUPLICATE_RECORD",
      message: "Registro duplicado.",
    });
    return sendError(res, req, {
      status: 409,
      code: "DUPLICATE_RECORD",
      message: "Registro duplicado.",
    });
  }

  // Violacao de NOT NULL do SQLite
  if (err.message && err.message.includes("NOT NULL constraint failed")) {
    logHandledError(reqLogger, {
      event: "Violacao NOT NULL",
      status: 400,
      code: "NOT_NULL_CONSTRAINT",
      message: "Campo obrigatorio nao preenchido.",
    });
    return sendError(res, req, {
      status: 400,
      code: "NOT_NULL_CONSTRAINT",
      message: "Campo obrigatorio nao preenchido.",
    });
  }

  // Violacao de CHECK constraint do SQLite
  if (err.message && err.message.includes("CHECK constraint failed")) {
    logHandledError(reqLogger, {
      event: "Violacao CHECK",
      status: 400,
      code: "CHECK_CONSTRAINT",
      message: "Valor invalido para o campo.",
    });
    return sendError(res, req, {
      status: 400,
      code: "CHECK_CONSTRAINT",
      message: "Valor invalido para o campo.",
    });
  }

  // Violacao de FOREIGN KEY do SQLite
  if (err.message && err.message.includes("FOREIGN KEY constraint failed")) {
    logHandledError(reqLogger, {
      event: "Violacao FOREIGN KEY",
      status: 400,
      code: "FOREIGN_KEY_CONSTRAINT",
      message: "Referencia invalida.",
    });
    return sendError(res, req, {
      status: 400,
      code: "FOREIGN_KEY_CONSTRAINT",
      message: "Referencia invalida.",
    });
  }

  // Log do erro para debugging (apenas em desenvolvimento mostra stack)
  if (!isProduction) {
    reqLogger.error("Erro nao tratado", {
      error: err.message,
      stack: err.stack,
    });
  } else {
    reqLogger.error("Erro nao tratado", {
      error: err.message,
    });
  }

  // Resposta generica (nao vaza detalhes em producao)
  return sendError(res, req, {
    status: err.status || 500,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: isProduction
      ? "Erro interno do servidor."
      : err.message || "Erro interno do servidor.",
  });
}
