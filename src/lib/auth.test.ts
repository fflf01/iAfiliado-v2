/**
 * Testes do módulo de autenticação (cookie HttpOnly + StoredUser em localStorage).
 * Token não é armazenado no cliente; apenas dados não sensíveis (id, username, roles) vão para localStorage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { getToken, getUser, setAuth, clearAuth, isAuthenticated } from "./auth";
import type { User } from "@/types";

const mockUser: User = {
  id: 1,
  full_name: "Test User",
  username: "test",
  email: "test@example.com",
  phone: "(11) 99999-9999",
  is_admin: false,
};

describe("auth", () => {
  beforeEach(() => {
    clearAuth();
  });

  describe("getToken", () => {
    it("retorna null (token está em cookie HttpOnly)", () => {
      expect(getToken()).toBeNull();
      setAuth("jwt-123", mockUser);
      expect(getToken()).toBeNull();
    });
  });

  describe("getUser", () => {
    it("retorna null quando não há usuário", () => {
      expect(getUser()).toBeNull();
    });
    it("retorna apenas StoredUser (dados não sensíveis) após setAuth", () => {
      setAuth("token", mockUser);
      expect(getUser()).toEqual({
        id: 1,
        username: "test",
        is_admin: false,
        is_support: undefined,
        is_manager: undefined,
        role: undefined,
      });
    });
    it("retorna null quando o valor em localStorage é JSON inválido", () => {
      localStorage.setItem("user", "invalid-json{{{");
      expect(getUser()).toBeNull();
    });
  });

  describe("setAuth", () => {
    it("armazena apenas dados não sensíveis no localStorage (sem email, phone, full_name)", () => {
      setAuth("abc", mockUser);
      const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
      expect(stored).toEqual({
        id: 1,
        username: "test",
        is_admin: false,
        is_support: undefined,
        is_manager: undefined,
        role: undefined,
      });
      expect(stored.email).toBeUndefined();
      expect(stored.phone).toBeUndefined();
      expect(stored.full_name).toBeUndefined();
    });
  });

  describe("clearAuth", () => {
    it("remove user e limpa sessionStorage", () => {
      setAuth("x", mockUser);
      sessionStorage.setItem("key", "value");
      clearAuth();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("isAuthenticated", () => {
    it("retorna false quando não há user", () => {
      expect(isAuthenticated()).toBe(false);
    });
    it("retorna true quando há user", () => {
      setAuth("any", mockUser);
      expect(isAuthenticated()).toBe(true);
    });
  });
});
