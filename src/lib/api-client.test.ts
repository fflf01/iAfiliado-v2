/**
 * Testes do API client: base URL, headers de auth e tratamento de erros.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "./api-client";
import * as auth from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getToken: vi.fn(),
}));

describe("api-client", () => {
  const getTokenMock = vi.mocked(auth.getToken);

  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockReturnValue(null);
  });

  describe("apiGet", () => {
    it("envia Authorization Bearer quando há token", async () => {
      getTokenMock.mockReturnValue("meu-jwt");
      let capturedUrl = "";
      let capturedInit: RequestInit = {};
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string, init?: RequestInit) => {
          capturedUrl = url;
          capturedInit = init ?? {};
          return Promise.resolve(
            new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
      );

      await apiGet("/me/stats");
      expect(capturedInit.headers).toEqual(
        expect.objectContaining({ Authorization: "Bearer meu-jwt" })
      );
      expect(capturedUrl).toMatch(/\/api\/me\/stats/);
      vi.unstubAllGlobals();
    });

    it("não envia Authorization quando getToken retorna null", async () => {
      let capturedInit: RequestInit = {};
      vi.stubGlobal(
        "fetch",
        vi.fn((_url: string, init?: RequestInit) => {
          capturedInit = init ?? {};
          return Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
      );
      await apiGet("/casinos");
      expect((capturedInit.headers as Record<string, string>)?.Authorization).toBeUndefined();
      vi.unstubAllGlobals();
    });

    it("lança ApiError com mensagem do body quando status 401", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({ error: "Token inválido ou expirado." }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            )
          )
        )
      );
      await expect(apiGet("/me/stats")).rejects.toThrow(ApiError);
      await expect(apiGet("/me/stats")).rejects.toMatchObject({
        message: "Token inválido ou expirado.",
        status: 401,
      });
      vi.unstubAllGlobals();
    });

    it("retorna dados quando status 200 e JSON válido", async () => {
      const data = { totalCliques: 10, totalDepositos: 5 };
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          )
        )
      );
      const result = await apiGet<typeof data>("/me/stats");
      expect(result).toEqual(data);
      vi.unstubAllGlobals();
    });
  });

  describe("apiPost", () => {
    it("envia body como JSON e Content-Type application/json", async () => {
      let capturedInit: RequestInit = {};
      vi.stubGlobal(
        "fetch",
        vi.fn((_url: string, init?: RequestInit) => {
          capturedInit = init ?? {};
          return Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
      );
      await apiPost("/register", { name: "A", login: "a", email: "a@a.com", password: "Senha1234" });
      expect((capturedInit.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json"
      );
      expect(JSON.parse(capturedInit.body as string)).toEqual(
        expect.objectContaining({ name: "A", login: "a" })
      );
      expect(capturedInit.method).toBe("POST");
      vi.unstubAllGlobals();
    });
  });

  describe("apiPut", () => {
    it("envia método PUT e body JSON", async () => {
      let capturedInit: RequestInit = {};
      vi.stubGlobal(
        "fetch",
        vi.fn((_url: string, init?: RequestInit) => {
          capturedInit = init ?? {};
          return Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
      );
      await apiPut("/admin/casinos/1", { nome: "Casino A" });
      expect(capturedInit.method).toBe("PUT");
      expect(JSON.parse(capturedInit.body as string)).toEqual({ nome: "Casino A" });
      vi.unstubAllGlobals();
    });
  });

  describe("apiDelete", () => {
    it("envia método DELETE", async () => {
      let capturedInit: RequestInit = {};
      vi.stubGlobal(
        "fetch",
        vi.fn((_url: string, init?: RequestInit) => {
          capturedInit = init ?? {};
          return Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        })
      );
      await apiDelete("/admin/casinos/1");
      expect(capturedInit.method).toBe("DELETE");
      vi.unstubAllGlobals();
    });
  });
});
