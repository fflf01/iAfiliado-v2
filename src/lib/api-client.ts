/**
 * API client centralizado.
 * Substitui todos os fetch() espalhados pelas paginas.
 * Auto-attach de Authorization header, validacao de content-type e error handling.
 */

import { getToken } from "@/lib/auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new ApiError(
      "Erro de conexao: o servidor retornou uma resposta inesperada.",
      response.status
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || "Erro inesperado do servidor.",
      response.status
    );
  }

  return data as T;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET com autenticacao automatica. */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<T>(response);
}

/** POST com body JSON e autenticacao automatica. */
export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/** POST com FormData (uploads) e autenticacao automatica. */
export async function apiPostForm<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleResponse<T>(response);
}

/** PUT com body JSON e autenticacao automatica. */
export async function apiPut<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/** DELETE com autenticacao automatica. */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<T>(response);
}

export { ApiError };
