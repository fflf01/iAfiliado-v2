/**
 * Envio de email para notificacoes (ex.: tentativas de login suspeitas).
 * Suporta SMTP (nodemailer) ou SendGrid. Se nenhum estiver configurado, apenas loga.
 * @module utils/emailService
 */

import { logger } from "./logger.js";

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

async function sendViaSendGrid({ to, subject, text }) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(SENDGRID_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: process.env.EMAIL_FROM || "noreply@iafiliado.com",
          name: process.env.EMAIL_FROM_NAME || "iAfiliado",
        },
        subject,
        content: [{ type: "text/plain", value: text }],
      }),
    });
    if (!res.ok) {
      logger.warn("SendGrid falhou", { status: res.status });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn("SendGrid request falhou", { error: err.message });
    return false;
  }
}

/** Envia email; usa SendGrid se SENDGRID_API_KEY existir. Caso contrario apenas loga. */
export async function sendEmail({ to, subject, text }) {
  if (!to || !subject) {
    logger.warn("sendEmail: to ou subject ausente");
    return false;
  }
  const sent = await sendViaSendGrid({ to, subject, text });
  if (!sent) {
    logger.info("Email nao enviado (SendGrid nao configurado ou falha)", { to, subject });
  }
  return sent;
}

/** Notifica usuario sobre tentativas de login falhas (chamado apos bloqueio). */
export async function notifySuspiciousLoginAttempts(userEmail, lockoutMinutes) {
  const subject = "Tentativas de login falhas na sua conta";
  const text = `Olá,\n\nDetectamos várias tentativas de login falhas na sua conta iAfiliado. Por segurança, o acesso foi temporariamente bloqueado por ${lockoutMinutes} minutos.\n\nSe foi você, basta aguardar e tentar novamente. Se não foi você, recomendamos alterar sua senha assim que possível.\n\nEquipe iAfiliado.`;
  return sendEmail({ to: userEmail, subject, text });
}
