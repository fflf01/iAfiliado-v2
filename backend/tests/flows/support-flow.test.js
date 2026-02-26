/**
 * Testes de fluxo: suporte público e ticket autenticado.
 * - POST /support (público) cria ticket
 * - POST /support/ticket (autenticado) cria ticket do usuário
 * - GET /support/my-messages lista tickets do usuário
 * - POST /support/ticket/:id/reply adiciona resposta (só dono)
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
  `iafiliado-flow-support-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`
);

let app;
let db;

async function registerAndLogin(app, db, { name, login, email }) {
  await request(app).post("/register").send({
    name,
    login,
    email,
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });
  const loginRes = await request(app)
    .post("/login")
    .send({ login, password: "Senha1234" });
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

test("fluxo suporte público: POST /support cria ticket sem auth", async () => {
  const res = await request(app).post("/support").send({
    name: "Visitante",
    email: "visitante@example.com",
    title: "Dúvida pública",
    message: "Preciso de ajuda.",
  });
  assert.equal(res.status, 201);
  assert.match(res.body.id, /^SUP-\d+$/);
  assert.equal(res.body.message, "Ticket criado com sucesso!");
});

test("fluxo suporte autenticado: criar ticket e listar em my-messages", async () => {
  const token = await registerAndLogin(app, db, {
    name: "Cliente Suporte",
    login: "cliente_sup",
    email: "cliente.sup@example.com",
  });

  const createRes = await request(app)
    .post("/support/ticket")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Cliente Suporte",
      email: "cliente.sup@example.com",
      title: "Ticket autenticado",
      message: "Conteúdo do ticket.",
    });
  assert.equal(createRes.status, 201);
  assert.match(createRes.body.id, /^SUP-\d+$/);

  const listRes = await request(app)
    .get("/support/my-messages")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(listRes.status, 200);
  assert.equal(Array.isArray(listRes.body), true);
  assert.equal(listRes.body.length, 1);
  assert.equal(listRes.body[0].subject, "Ticket autenticado");
});

test("fluxo suporte: reply no próprio ticket e outro usuário recebe 403", async () => {
  const ownerToken = await registerAndLogin(app, db, {
    name: "Dono",
    login: "dono_ticket",
    email: "dono@example.com",
  });
  const otherToken = await registerAndLogin(app, db, {
    name: "Outro",
    login: "outro_user",
    email: "outro@example.com",
  });

  const createRes = await request(app)
    .post("/support/ticket")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      name: "Dono",
      email: "dono@example.com",
      title: "Meu ticket",
      message: "Conteúdo",
    });
  assert.equal(createRes.status, 201);
  const numericId = Number(createRes.body.id.replace("SUP-", ""));

  const replyOwner = await request(app)
    .post(`/support/ticket/${numericId}/reply`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ message: "Minha resposta" });
  assert.equal(replyOwner.status, 201);

  const replyOther = await request(app)
    .post(`/support/ticket/${numericId}/reply`)
    .set("Authorization", `Bearer ${otherToken}`)
    .send({ message: "Tentativa invasão" });
  assert.equal(replyOther.status, 403);
  assert.equal(replyOther.body?.code, "FORBIDDEN");
});

test("fluxo suporte: POST /support sem subject/title retorna 400", async () => {
  const res = await request(app).post("/support").send({
    name: "Visitante",
    email: "v@example.com",
    message: "Sem título",
  });
  assert.equal(res.status, 400);
  assert.equal(res.body?.code, "VALIDATION_ERROR");
});
