/**
 * Verificacao de token reCAPTCHA v2 (Google).
 * Se RECAPTCHA_SECRET_KEY nao estiver definida, nao valida (ambiente dev/test).
 * @module utils/captcha
 */

import { logger } from "./logger.js";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/** Retorna true se RECAPTCHA_SECRET_KEY estiver definida (CAPTCHA ativo). Em test, retorna false para não exigir token nos testes. */
export function isCaptchaEnabled() {
  if (process.env.NODE_ENV === "test") return false;
  return !!(
    process.env.RECAPTCHA_SECRET_KEY &&
    String(process.env.RECAPTCHA_SECRET_KEY).trim()
  );
}

export async function verifyRecaptcha(token, remoteip = null) {
  if (process.env.NODE_ENV === "test") return true;

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    logger.warn("RECAPTCHA_SECRET_KEY nao definida; verificacao de CAPTCHA desativada.");
    return true;
  }

  const body = new URLSearchParams({
    secret,
    response: token || "",
    ...(remoteip ? { remoteip } : {}),
  });

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();
    if (!data.success) {
      logger.warn("reCAPTCHA verificacao falhou", { "error-codes": data["error-codes"] });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn("reCAPTCHA request falhou", { error: err.message });
    return false;
  }
}
