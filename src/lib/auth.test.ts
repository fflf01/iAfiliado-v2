/**
 * Testes do módulo de autenticação (localStorage).
 * Garante que getToken, getUser, setAuth, clearAuth e isAuthenticated
 * se comportam corretamente.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { getToken, getUser, setAuth, clearAuth, isAuthenticated } from "./auth";
import type { User } from "@/types";

const mockUser: User = {
  id: 1,
  full_name: "Test User",
  username: "test",
  email: "test@example.com",
  is_admin: false,
};

describe("auth", () => {
  beforeEach(() => {
    clearAuth();
  });

  describe("getToken", () => {
    it("retorna null quando não há token", () => {
      expect(getToken()).toBeNull();
    });
    it("retorna o token após setAuth", () => {
      setAuth("jwt-123", mockUser);
      expect(getToken()).toBe("jwt-123");
    });
  });

  describe("getUser", () => {
    it("retorna null quando não há usuário", () => {
      expect(getUser()).toBeNull();
    });
    it("retorna o usuário após setAuth", () => {
      setAuth("token", mockUser);
      expect(getUser()).toEqual(mockUser);
    });
    it("retorna null quando o valor em localStorage é JSON inválido", () => {
      localStorage.setItem("user", "invalid-json{{{");
      expect(getUser()).toBeNull();
    });
  });

  describe("setAuth", () => {
    it("armazena token e user no localStorage", () => {
      setAuth("abc", mockUser);
      expect(localStorage.getItem("token")).toBe("abc");
      expect(JSON.parse(localStorage.getItem("user") ?? "{}")).toEqual(mockUser);
    });
  });

  describe("clearAuth", () => {
    it("remove token e user e limpa sessionStorage", () => {
      setAuth("x", mockUser);
      sessionStorage.setItem("key", "value");
      clearAuth();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("isAuthenticated", () => {
    it("retorna false quando não há token", () => {
      expect(isAuthenticated()).toBe(false);
    });
    it("retorna true quando há token", () => {
      setAuth("any", mockUser);
      expect(isAuthenticated()).toBe(true);
    });
  });
});
