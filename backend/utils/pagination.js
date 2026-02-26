const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Limites para listagens administrativas (/admin/*): padrão e teto máximo. */
export const ADMIN_DEFAULT_LIMIT = 50;
export const ADMIN_MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function resolvePagination(query = {}, options = {}) {
  const defaultPage = parsePositiveInt(options.defaultPage, DEFAULT_PAGE);
  const defaultLimit = parsePositiveInt(options.defaultLimit, DEFAULT_LIMIT);
  const maxLimit = parsePositiveInt(options.maxLimit, MAX_LIMIT);

  const page = parsePositiveInt(query.page, defaultPage);
  const requestedLimit = parsePositiveInt(query.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Resolve limit/offset para listagens administrativas.
 * Valores inválidos ou acima do teto são ignorados (usa padrão/teto).
 * @param {object} [query] - req.query (limit, page)
 * @returns {{ limit: number, offset: number, page: number }}
 */
export function resolveAdminListLimit(query = {}) {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInt(query.limit, ADMIN_DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, requestedLimit), ADMIN_MAX_LIMIT);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}
