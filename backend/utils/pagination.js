const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

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
