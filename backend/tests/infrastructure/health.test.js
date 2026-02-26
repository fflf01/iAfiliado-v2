/**
 * Testes de infraestrutura: health check e disponibilidade da API.
 * - GET /health retorna 200 e status ok
 * - Resposta é JSON e não exige autenticação
 */
import test, { before, after } from "node:test";
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
  `iafiliado-health-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`
);

let app;
let db;

before(async () => {
  const serverModule = await import("../../server.js");
  const dbModule = await import("../../db.js");
  app = serverModule.default;
  db = dbModule.default;
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

test("GET /health retorna 200 e JSON com status ok", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(res.body?.status, "ok");
  assert.equal(typeof res.body?.uptime, "number");
});

test("GET /health não exige Authorization", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body?.status, "ok");
});
