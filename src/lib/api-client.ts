/**
 * API client centralizado.
 * Substitui todos os fetch() espalhados pelas paginas.
 * Auto-attach de Authorization header, validacao de content-type e error handling.
 */


// Em dev sem .env: usa /api e o proxy do Vite encaminha para o backend (porta 3000).
// Em prod: defina VITE_API_BASE_URL (ex: /api ou https://sua-api.com).
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson =
    contentType.includes("application/json") ||
    contentType.includes("application/json;");

  const text = await response.text();

  if (!isJson) {
    const status = response.status;
    if (status === 0) {
      throw new ApiError(
        "Nao foi possivel conectar ao servidor. Verifique se a API esta rodando e a URL (VITE_API_BASE_URL).",
        status
      );
    }
    const hint =
      text.trim().startsWith("<") || text.includes("<!DOCTYPE")
        ? " O servidor retornou HTML (pagina de erro ou proxy)."
        : "";
    throw new ApiError(
      `Erro de conexao: resposta inesperada (status ${status}).${hint} Verifique se a API esta acessivel.`,
      status
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(
      "Erro de conexao: o servidor retornou uma resposta inesperada.",
      response.status
    );
  }

  if (!response.ok) {
    const err = data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : "Erro inesperado do servidor.";
    const code = data && typeof data === "object" && "code" in data && typeof (data as { code: unknown }).code === "string"
      ? (data as { code: string }).code
      : undefined;
    throw new ApiError(err, response.status, code);
  }

  return data as T;
}

/** Cookie HttpOnly e enviado automaticamente com credentials: 'include'. Nao envia Bearer. */
const FETCH_CREDENTIALS: RequestCredentials = "include";

/** GET com autenticacao via cookie HttpOnly. */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: FETCH_CREDENTIALS,
  });
  return handleResponse<T>(response);
}

/** POST com body JSON e autenticacao via cookie. */
export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: FETCH_CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/** POST com FormData (uploads) e autenticacao via cookie. */
export async function apiPostForm<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: FETCH_CREDENTIALS,
    body: formData,
  });
  return handleResponse<T>(response);
}

/** PUT com body JSON e autenticacao via cookie. */
export async function apiPut<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    credentials: FETCH_CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/** DELETE com autenticacao via cookie. */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    credentials: FETCH_CREDENTIALS,
  });
  return handleResponse<T>(response);
}

export { ApiError };
