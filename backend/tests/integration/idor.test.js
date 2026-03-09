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
  `iafiliado-idor-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`,
);

let app;
let db;

async function registerAndLoginUser({
  name,
  login,
  email,
  cpfCnpj = "12345678909",
  password = "Senha1234",
  isAdmin = false,
}) {
  const registerRes = await request(app).post("/register").send({
    name,
    login,
    email,
    cpfCnpj,
    password,
  });
  assert.equal(registerRes.status, 201);

  if (isAdmin) {
    db.prepare("UPDATE users SET is_admin = 1, role = 'admin' WHERE username = ?").run(login);
  }

  const loginRes = await request(app).post("/login").send({ login, password });
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

test("usuario nao consegue acessar replies de ticket de outro usuario (IDOR em /support/ticket/:id/replies)", async () => {
  const ownerToken = await registerAndLoginUser({
    name: "Owner",
    login: "owner_idor",
    email: "owner.idor@example.com",
  });
  const outsiderToken = await registerAndLoginUser({
    name: "Outsider",
    login: "outsider_idor",
    email: "outsider.idor@example.com",
  });

  const createRes = await request(app)
    .post("/support/ticket")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      name: "Owner",
      email: "owner.idor@example.com",
      title: "Ticket sensivel",
      message: "Conteudo privado",
    });

  assert.equal(createRes.status, 201);
  const ticketNumericId = Number(createRes.body.id.replace("SUP-", ""));

  const repliesRes = await request(app)
    .get(`/support/ticket/${ticketNumericId}/replies`)
    .set("Authorization", `Bearer ${outsiderToken}`);

  assert.equal(repliesRes.status, 403, "Outro usuario nao deve conseguir listar replies de ticket alheio");
  assert.equal(repliesRes.body.code, "FORBIDDEN");
});

test("endpoints /me/* retornam apenas dados do usuario autenticado (entradas, withdrawals, casas)", async () => {
  const tokenUser1 = await registerAndLoginUser({
    name: "User 1",
    login: "user1_idor",
    email: "user1.idor@example.com",
  });
  const tokenUser2 = await registerAndLoginUser({
    name: "User 2",
    login: "user2_idor",
    email: "user2.idor@example.com",
  });

  const user1Row = db.prepare("SELECT id FROM users WHERE username = ?").get("user1_idor");
  const user2Row = db.prepare("SELECT id FROM users WHERE username = ?").get("user2_idor");
  assert.ok(user1Row?.id);
  assert.ok(user2Row?.id);

  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES ('c1', 'Casa 1', 'active')",
  ).run();
  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES ('c2', 'Casa 2', 'active')",
  ).run();

  // Entradas para ambos os usuarios
  const now = Date.now();
  db.prepare(
    `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
     VALUES ('e-user1-1', ?, 'c1', ?, 10, 100, 5, 2, 30)`,
  ).run(user1Row.id, now);
  db.prepare(
    `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
     VALUES ('e-user1-2', ?, 'c2', ?, 3, 30, 1, 1, 10)`,
  ).run(user1Row.id, now);
  db.prepare(
    `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
     VALUES ('e-user2-1', ?, 'c1', ?, 99, 999, 9, 9, 999)`,
  ).run(user2Row.id, now);

  // Withdrawals para ambos os usuarios
  db.prepare(
    "INSERT INTO withdrawal_requests (id, user_id, valor, metodo, status) VALUES ('wr-user1-1', ?, 100, 'PIX', 'pendente')",
  ).run(user1Row.id);
  db.prepare(
    "INSERT INTO withdrawal_requests (id, user_id, valor, metodo, status) VALUES ('wr-user2-1', ?, 200, 'PIX', 'pendente')",
  ).run(user2Row.id);

  // Casas de afiliado para ambos os usuarios
  db.prepare(
    "INSERT INTO affiliate_casinos (id, user_id, casino_id, status, link) VALUES ('ac-user1-1', ?, 'c1', 'active', 'https://example.com/u1/c1')",
  ).run(user1Row.id);
  db.prepare(
    "INSERT INTO affiliate_casinos (id, user_id, casino_id, status, link) VALUES ('ac-user2-1', ?, 'c2', 'active', 'https://example.com/u2/c2')",
  ).run(user2Row.id);

  const entradasUser1 = await request(app)
    .get("/me/entradas")
    .set("Authorization", `Bearer ${tokenUser1}`);
  assert.equal(entradasUser1.status, 200);
  assert.equal(Array.isArray(entradasUser1.body), true);
  assert.equal(
    entradasUser1.body.length,
    2,
    "User 1 deve ver apenas as 2 entradas proprias, nao as de outros usuarios",
  );

  const entradasUser2 = await request(app)
    .get("/me/entradas")
    .set("Authorization", `Bearer ${tokenUser2}`);
  assert.equal(entradasUser2.status, 200);
  assert.equal(Array.isArray(entradasUser2.body), true);
  assert.equal(
    entradasUser2.body.length,
    1,
    "User 2 deve ver apenas sua entrada, nao as de outros usuarios",
  );

  const withdrawalsUser1 = await request(app)
    .get("/me/withdrawals")
    .set("Authorization", `Bearer ${tokenUser1}`);
  assert.equal(withdrawalsUser1.status, 200);
  assert.equal(Array.isArray(withdrawalsUser1.body), true);
  assert.equal(withdrawalsUser1.body.length, 1);
  assert.ok(withdrawalsUser1.body[0].id.includes("wr-user1-1"));

  const withdrawalsUser2 = await request(app)
    .get("/me/withdrawals")
    .set("Authorization", `Bearer ${tokenUser2}`);
  assert.equal(withdrawalsUser2.status, 200);
  assert.equal(Array.isArray(withdrawalsUser2.body), true);
  assert.equal(withdrawalsUser2.body.length, 1);
  assert.ok(withdrawalsUser2.body[0].id.includes("wr-user2-1"));

  const casasUser1 = await request(app)
    .get("/me/casas")
    .set("Authorization", `Bearer ${tokenUser1}`);
  assert.equal(casasUser1.status, 200);
  assert.equal(Array.isArray(casasUser1.body), true);
  assert.equal(casasUser1.body.length, 1);
  assert.equal(casasUser1.body[0].casinoId, "c1");

  const casasUser2 = await request(app)
    .get("/me/casas")
    .set("Authorization", `Bearer ${tokenUser2}`);
  assert.equal(casasUser2.status, 200);
  assert.equal(Array.isArray(casasUser2.body), true);
  assert.equal(casasUser2.body.length, 1);
  assert.equal(casasUser2.body[0].casinoId, "c2");
});

