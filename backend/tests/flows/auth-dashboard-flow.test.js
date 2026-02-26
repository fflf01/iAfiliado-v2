/**
 * Testes de fluxo: registro → login → área logada (dashboard).
 * Garante que um usuário consegue se registrar, fazer login e acessar
 * /me/stats, /me/casas, /me/wallet, /me/entradas e /profile.
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
  `iafiliado-flow-auth-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`
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
  db.exec("DELETE FROM wallet_totals");
  db.exec("DELETE FROM entradas");
  db.exec("DELETE FROM affiliate_agreements");
  db.exec("DELETE FROM affiliate_casinos");
  db.exec("DELETE FROM contracts");
  db.exec("DELETE FROM withdrawal_requests");
  db.exec("DELETE FROM casinos");
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

test("fluxo completo: register → login → profile → me/stats, me/casas, me/wallet, me/entradas", async () => {
  // 1. Registro
  const registerRes = await request(app)
    .post("/register")
    .send({
      name: "Usuario Fluxo",
      login: "fluxo_user",
      email: "fluxo@example.com",
      cpfCnpj: "12345678909",
      password: "Senha1234",
    });
  assert.equal(registerRes.status, 201, "registro deve retornar 201");
  assert.equal(typeof registerRes.body.token, "string");
  assert.equal(registerRes.body.user?.email, "fluxo@example.com");
  const token = registerRes.body.token;

  // 2. Login (novo request)
  const loginRes = await request(app)
    .post("/login")
    .send({ login: "fluxo_user", password: "Senha1234" });
  assert.equal(loginRes.status, 200);
  assert.equal(typeof loginRes.body.token, "string");
  const tokenLogin = loginRes.body.token;

  // 3. Profile
  const profileRes = await request(app)
    .get("/profile")
    .set("Authorization", `Bearer ${tokenLogin}`);
  assert.equal(profileRes.status, 200);
  assert.equal(profileRes.body?.user?.email, "fluxo@example.com");
  assert.equal(profileRes.body?.user?.username, "fluxo_user");

  // 4. Dashboard: me/stats
  const statsRes = await request(app)
    .get("/me/stats")
    .set("Authorization", `Bearer ${tokenLogin}`);
  assert.equal(statsRes.status, 200);
  assert.equal(typeof statsRes.body.totalCliques, "number");
  assert.equal(typeof statsRes.body.totalDepositos, "number");
  assert.equal(typeof statsRes.body.comissaoTotal, "number");
  assert.equal(typeof statsRes.body.totalFtds, "number");

  // 5. Dashboard: me/casas (lista vazia inicial)
  const casasRes = await request(app)
    .get("/me/casas")
    .set("Authorization", `Bearer ${tokenLogin}`);
  assert.equal(casasRes.status, 200);
  assert.equal(Array.isArray(casasRes.body), true);

  // 6. Dashboard: me/wallet
  const walletRes = await request(app)
    .get("/me/wallet")
    .set("Authorization", `Bearer ${tokenLogin}`);
  assert.equal(walletRes.status, 200);
  assert.equal(typeof walletRes.body.saldoDisponivel, "number");
  assert.equal(typeof walletRes.body.valorRecebidoTotal, "number");
  assert.equal(typeof walletRes.body.valorTotalSacado, "number");

  // 7. Dashboard: me/entradas (lista vazia inicial)
  const entradasRes = await request(app)
    .get("/me/entradas")
    .set("Authorization", `Bearer ${tokenLogin}`);
  assert.equal(entradasRes.status, 200);
  assert.equal(Array.isArray(entradasRes.body), true);
});

test("fluxo: login com credenciais inválidas retorna 401", async () => {
  await request(app).post("/register").send({
    name: "User",
    login: "user_x",
    email: "userx@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });

  const res = await request(app)
    .post("/login")
    .send({ login: "user_x", password: "SenhaErrada" });
  assert.equal(res.status, 401);
  assert.equal(res.body?.code, "UNAUTHORIZED");
});

test("fluxo: acesso a /me/stats sem token retorna 401", async () => {
  const res = await request(app).get("/me/stats");
  assert.equal(res.status, 401);
  assert.equal(res.body?.code, "UNAUTHORIZED");
});
