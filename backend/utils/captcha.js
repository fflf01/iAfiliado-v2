/**
 * Verificacao de token reCAPTCHA v2 (Google).
 * Se RECAPTCHA_SECRET_KEY nao estiver definida, nao valida (ambiente dev/test).
 * @module utils/captcha
 */

import { logger } from "./logger.js";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export async function verifyRecaptcha(token, remoteip = null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "test") return true;
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
