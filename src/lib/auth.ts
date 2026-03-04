/**
 * Utilitarios de autenticacao centralizados.
 * O token JWT fica em cookie HttpOnly. No localStorage persiste apenas StoredUser (dados nao sensiveis).
 * Dados sensiveis (email, telefone, nome) devem ser obtidos via API (ex: GET /profile).
 */

import type { User, StoredUser } from "@/types";

const USER_KEY = "user";

function toStoredUser(user: User): StoredUser {
  return {
    id: user.id,
    username: user.username,
    is_admin: user.is_admin,
    is_support: user.is_support,
    is_manager: user.is_manager,
    role: user.role,
  };
}

/** Token nao e armazenado no cliente; esta no cookie HttpOnly. Retorna null para compatibilidade. */
export function getToken(): string | null {
  return null;
}

/** Retorna apenas dados nao sensiveis armazenados no cliente. Para perfil completo, use GET /profile. */
export function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

/** Persiste apenas dados nao sensiveis (id, username, roles). Token no cookie HttpOnly. */
export function setAuth(_token: string, user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(toStoredUser(user)));
}

export function clearAuth(): void {
  localStorage.removeItem(USER_KEY);
  sessionStorage.clear();
}

export function isAuthenticated(): boolean {
  return !!getUser();
}
