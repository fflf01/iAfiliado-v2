/**
 * Middleware centralizado de tratamento de erros.
 * asyncHandler elimina try-catch repetitivos nos route handlers.
 * errorHandler trata erros conhecidos (SQLite, Multer) e retorna respostas seguras.
 * @module middleware/errorHandler
 */

import multer from "multer";

const isProduction = process.env.NODE_ENV === "production";

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
  // Erros do Multer (upload de arquivos)
  if (err instanceof multer.MulterError) {
    const multerMessages = {
      LIMIT_FILE_SIZE: "Arquivo excede o tamanho maximo permitido.",
      LIMIT_FILE_COUNT: "Limite de arquivos excedido.",
      LIMIT_UNEXPECTED_FILE: "Campo de arquivo inesperado.",
    };
    const message = multerMessages[err.code] || "Erro no upload de arquivo.";
    return res.status(400).json({ error: message });
  }

  // Erro de tipo de arquivo (lançado pelo fileFilter do Multer)
  if (err?.message === "Tipo de arquivo não permitido") {
    return res.status(400).json({ error: "Tipo de arquivo nao permitido." });
  }

  // Violacao de unicidade do SQLite (email/username duplicado)
  if (err.message && err.message.includes("UNIQUE constraint failed")) {
    if (err.message.includes("email")) {
      return res.status(409).json({ error: "Este e-mail ja esta em uso." });
    }
    if (err.message.includes("username")) {
      return res.status(409).json({ error: "Este login ja esta em uso." });
    }
    return res.status(409).json({ error: "Registro duplicado." });
  }

  // Violacao de NOT NULL do SQLite
  if (err.message && err.message.includes("NOT NULL constraint failed")) {
    return res.status(400).json({ error: "Campo obrigatorio nao preenchido." });
  }

  // Violacao de CHECK constraint do SQLite
  if (err.message && err.message.includes("CHECK constraint failed")) {
    return res.status(400).json({ error: "Valor invalido para o campo." });
  }

  // Violacao de FOREIGN KEY do SQLite
  if (err.message && err.message.includes("FOREIGN KEY constraint failed")) {
    return res.status(400).json({ error: "Referencia invalida." });
  }

  // Log do erro para debugging (apenas em desenvolvimento mostra stack)
  if (!isProduction) {
    console.error("Erro nao tratado:", err);
  } else {
    console.error("Erro:", err.message);
  }

  // Resposta generica (nao vaza detalhes em producao)
  return res.status(err.status || 500).json({
    error: isProduction
      ? "Erro interno do servidor."
      : err.message || "Erro interno do servidor.",
  });
}
