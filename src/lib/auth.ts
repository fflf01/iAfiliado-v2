/**
 * Utilitarios de autenticacao centralizados.
 * Substitui todos os acessos diretos a localStorage espalhados pelo codigo.
 */

import type { User } from "@/types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.clear();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
