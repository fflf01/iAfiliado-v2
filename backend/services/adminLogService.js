import { adminRepository } from "../repositories/adminRepository.js";
import { logger } from "../utils/logger.js";

function safeJson(value) {
  try {
    if (value == null) return null;
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Registra ações administrativas em admin_logs (log_admin).
 * Nunca deve quebrar o fluxo principal do endpoint.
 */
export const adminLogService = {
  tryLog(req, { action, targetType, targetId = null, message = null, payload = null }) {
    try {
      const adminUserId = req?.user?.id ?? null;
      const ip =
        (req?.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) ||
        req?.ip ||
        null;
      const requestId = req?.requestId ?? null;

      adminRepository.insertAdminLog({
        adminUserId,
        action,
        targetType,
        targetId,
        message,
        payloadJson: safeJson(payload),
        ip: Array.isArray(ip) ? ip[0] : ip,
        requestId,
      });
    } catch (err) {
      logger.warn("Falha ao registrar admin_logs", { error: err.message });
    }
  },
};

