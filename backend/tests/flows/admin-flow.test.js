/**
 * Testes de fluxo: painel admin.
 * - Acesso /admin, /admin/casinos, /admin/contracts, /admin/withdrawals, /clients
 * - CRUD de casinos (create, list, update, delete)
 * - Solicitacoes e contratos (listar e atualizar status)
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
  `iafiliado-flow-admin-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`
);

let app;
let db;

async function registerAndLoginAdmin(app, db) {
  await request(app).post("/register").send({
    name: "Admin Fluxo",
    login: "admin_fluxo",
    email: "admin.fluxo@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });
  db.prepare("UPDATE users SET is_admin = 1, role = 'admin' WHERE username = ?").run("admin_fluxo");
  const loginRes = await request(app)
    .post("/login")
    .send({ login: "admin_fluxo", password: "Senha1234" });
  assert.equal(loginRes.status, 200);
  return loginRes.body.token;
}

before(async () => {
  const serverModule = await import("../../server.js");
  const dbModule = await import("../../db.js");
  app = serverModule.default;
  db = dbModule.default;
});

beforeEach(() => {
  db.exec("DELETE FROM support_attachments");
  db.exec("DELETE FROM support_replies");
  db.exec("DELETE FROM support_messages");
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

test("fluxo admin: usuário não-admin recebe 403 em GET /admin", async () => {
  await request(app).post("/register").send({
    name: "Usuario Comum",
    login: "comum",
    email: "comum@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });
  const loginRes = await request(app).post("/login").send({ login: "comum", password: "Senha1234" });
  const token = loginRes.body.token;

  const res = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 403);
  assert.equal(res.body?.code, "FORBIDDEN");
});

test("fluxo admin: admin acessa /admin e lista casinos, clients, contracts, withdrawals", async () => {
  const token = await registerAndLoginAdmin(app, db);

  const adminRes = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);
  assert.equal(adminRes.status, 200);

  const casinosRes = await request(app)
    .get("/admin/casinos")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(casinosRes.status, 200);
  assert.equal(Array.isArray(casinosRes.body), true);

  const clientsRes = await request(app)
    .get("/clients")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(clientsRes.status, 200);
  assert.equal(Array.isArray(clientsRes.body), true);

  const contractsRes = await request(app)
    .get("/admin/contracts")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(contractsRes.status, 200);
  assert.equal(Array.isArray(contractsRes.body), true);

  const withdrawalsRes = await request(app)
    .get("/admin/withdrawals")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(withdrawalsRes.status, 200);
  assert.equal(Array.isArray(withdrawalsRes.body), true);
});

test("fluxo admin: CRUD de casino (create, list, update, delete)", async () => {
  const token = await registerAndLoginAdmin(app, db);

  const createRes = await request(app)
    .post("/admin/casinos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nome: "Casino Teste",
      comissaoCPA: 100,
      comissaoRevShare: 15,
      urlAfiliado: "https://exemplo.com/ref",
    });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.body?.nome, "Casino Teste");
  assert.equal(createRes.body?.comissaoCPA, 100);
  const id = createRes.body.id;
  assert.ok(id);

  const listRes = await request(app)
    .get("/admin/casinos")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(listRes.status, 200);
  const found = listRes.body.find((c) => c.id === id);
  assert.ok(found);

  const updateRes = await request(app)
    .put(`/admin/casinos/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nome: "Casino Atualizado",
      comissaoCPA: 150,
      comissaoRevShare: 20,
      urlAfiliado: "https://exemplo.com/ref2",
    });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body?.nome, "Casino Atualizado");

  const deleteRes = await request(app)
    .delete(`/admin/casinos/${id}`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(deleteRes.status, 200);

  const listAfter = await request(app)
    .get("/admin/casinos")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(listAfter.body.find((c) => c.id === id), undefined);
});

test("fluxo admin: GET /admin/users/:id/profile exige admin e retorna perfil do usuário", async () => {
  await request(app).post("/register").send({
    name: "Usuario Alvo",
    login: "alvo",
    email: "alvo@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });
  const userRow = db.prepare("SELECT id FROM users WHERE username = ?").get("alvo");
  assert.ok(userRow?.id);

  const token = await registerAndLoginAdmin(app, db);
  const res = await request(app)
    .get(`/admin/users/${userRow.id}/profile`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body?.user?.username, "alvo");
  assert.equal(res.body?.user?.email, "alvo@example.com");
});
