import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "12345678901234567890123456789012";
process.env.CORS_ORIGINS = "http://allowed.local";
process.env.DB_PATH = path.join(
  os.tmpdir(),
  `iafiliado-cors-test-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`,
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

test("CORS permite origem presente na whitelist", async () => {
  const res = await request(app)
    .get("/health")
    .set("Origin", "http://allowed.local");

  assert.equal(res.status, 200);
  assert.equal(res.headers["access-control-allow-origin"], "http://allowed.local");
});

test("CORS bloqueia origem fora da whitelist com erro explicito", async () => {
  const res = await request(app)
    .get("/health")
    .set("Origin", "http://blocked.local");

  assert.equal(res.status, 403);
  assert.equal(res.body.code, "CORS_FORBIDDEN");
  assert.match(res.body.error, /CORS/i);
});
