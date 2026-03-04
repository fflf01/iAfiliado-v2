/**
 * Store em memoria das tentativas de login falhas por IP.
 * Usado para exigir CAPTCHA apos N tentativas (janela de 15 min).
 * Em ambiente multi-instancia usar Redis; aqui um Map com limpeza periodica.
 * @module utils/loginAttemptsStore
 */

import { AUTH } from "../config/constants.js";

const store = new Map();

function now() {
  return Date.now();
}

function prune(entry) {
  if (entry.resetAt < now()) {
    store.delete(entry.key);
    return true;
  }
  return false;
}

export const loginAttemptsStore = {
  get(ip) {
    const key = String(ip || "").trim() || "unknown";
    const entry = store.get(key);
    if (!entry) return 0;
    if (prune(entry)) return 0;
    return entry.count;
  },

  increment(ip) {
    const key = String(ip || "").trim() || "unknown";
    const entry = store.get(key);
    const resetAt = now() + AUTH.IP_ATTEMPTS_WINDOW_MS;
    if (!entry) {
      store.set(key, { key, count: 1, resetAt });
      return 1;
    }
    if (entry.resetAt < now()) {
      entry.count = 1;
      entry.resetAt = resetAt;
      return 1;
    }
    entry.count += 1;
    return entry.count;
  },

  reset(ip) {
    const key = String(ip || "").trim() || "unknown";
    store.delete(key);
  },

  /** Remove entradas expiradas (chamar periodicamente se desejar). */
  pruneExpired() {
    for (const [k, entry] of store.entries()) {
      if (entry.resetAt < now()) store.delete(k);
    }
  },
};
