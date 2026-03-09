/**
 * Hook reativo para estado de autenticacao.
 * Centraliza leitura de token/user e fornece funcao de logout.
 * Expoe a role derivada e helpers de permissao.
 * Importante: privilegios sempre sao confirmados com o backend via /profile.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "@/lib/auth";
import { deriveRole, canAccessAdmin as checkAdminAccess } from "@/lib/permissions";
import type { StoredUser } from "@/types";
import { apiGet, apiPost } from "@/lib/api-client";

export function useAuth() {
  const [user, setUser] = useState<StoredUser | null>(() => getUser());
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  const role = useMemo(() => deriveRole(user), [user]);

  // Confirma sempre os privilegios com o backend
  useEffect(() => {
    let cancelled = false;

    async function verifyWithServer() {
      try {
        const response = await apiGet<{ user: StoredUser | null }>("/profile");
        if (cancelled) return;

        if (response?.user) {
          // Atualiza estado local com os dados retornados pelo backend
          setUser((current) => {
            if (
              current &&
              current.id === response.user!.id &&
              current.is_admin === response.user!.is_admin &&
              current.is_support === response.user!.is_support &&
              current.is_manager === response.user!.is_manager
            ) {
              return current;
            }
            // Nao persistimos aqui no localStorage para evitar confiar demais no cliente;
            // o backend continua sendo a fonte de verdade a cada carregamento.
            return {
              id: response.user.id,
              username: response.user.username,
              is_admin: !!response.user.is_admin,
              is_support: !!response.user.is_support,
              is_manager: !!response.user.is_manager,
              role: response.user.role,
            };
          });
        } else {
          setUser(null);
        }
      } catch {
        // Se o backend negar (401/403) ou houver erro grave, consideramos nao autenticado
        clearAuth();
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsVerifying(false);
        }
      }
    }

    void verifyWithServer();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/logout", {});
    } catch {
      // Cookie pode já ter expirado; limpa estado local de qualquer forma
    }
    clearAuth();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return {
    user,
    role,
    isVerifying,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    isSupport: !!user?.is_support,
    isManager: !!user?.is_manager,
    canAccessAdmin: checkAdminAccess(role),
    logout,
  };
}
