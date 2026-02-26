/**
 * Testes de infraestrutura: tratamento de erros da API.
 * - Respostas de erro incluem requestId
 * - Códigos de erro consistentes (VALIDATION_ERROR, UNAUTHORIZED, etc.)
 * - Rota inexistente retorna 404
 */
import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.DB_PATH = path.join(
  os.tmpdir(),
  `iafiliado-error-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`
);

let app;
let db;

before(async () => {
  const serverModule = await import("../../server.js");
  const dbModule = await import("../../db.js");
  app = serverModule.default;
  db = dbModule.default;
});

beforeEach(() => {
  db.exec("DELETE FROM users");
});

after(() => {
  try {
    db.close();
  } catch {
    // ignore
  }
  if (fs.existsSync(process.env.DB_PATH)) {
    fs.unlinkSync(process.env.DB_PATH);
  }
});

test("resposta de erro inclui requestId (string não vazia)", async () => {
  const res = await request(app).post("/login").send({ login: "inexistente", password: "x" });
  assert.equal(res.status, 401);
  assert.equal(typeof res.body?.requestId, "string");
  assert.ok(res.body.requestId.length > 0);
});

test("erro de validação retorna code VALIDATION_ERROR e status 400", async () => {
  const res = await request(app).post("/register").send({
    name: "A",
    login: "a",
    email: "invalid-email",
    cpfCnpj: "123",
    password: "short",
  });
  assert.equal(res.status, 400);
  assert.equal(res.body?.code, "VALIDATION_ERROR");
  assert.ok(res.body?.error);
});

test("rota inexistente retorna 404", async () => {
  const res = await request(app).get("/rota-que-nao-existe");
  assert.equal(res.status, 404);
});

test("GET /me/stats sem token retorna 401 e code UNAUTHORIZED", async () => {
  const res = await request(app).get("/me/stats");
  assert.equal(res.status, 401);
  assert.equal(res.body?.code, "UNAUTHORIZED");
});

test("resposta de erro é JSON", async () => {
  const res = await request(app).post("/login").send({});
  assert.equal(res.status, 400);
  assert.equal(res.headers["content-type"], "application/json; charset=utf-8");
  assert.ok(typeof res.body === "object");
});
