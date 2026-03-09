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
  `iafiliado-sqli-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`,
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

const INJECTION_PAYLOADS = [
  "' OR 1=1--",
  "\" OR \"1\"=\"1\"--",
  "'; DROP TABLE users;--",
  "1; SELECT sqlite_version();--",
  "admin'--",
];

test("login nao aceita payloads de SQL injection em login/email", async () => {
  await request(app).post("/register").send({
    name: "Usuario",
    login: "usuario_legitimo",
    email: "user@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });

  for (const payload of INJECTION_PAYLOADS) {
    const res = await request(app).post("/login").send({
      login: payload,
      password: "Senha1234",
    });
    assert.equal(
      res.status === 400 || res.status === 401,
      true,
      `login com payload "${payload}" nao deve ser aceito`,
    );
  }

  const legitLogin = await request(app).post("/login").send({
    login: "usuario_legitimo",
    password: "Senha1234",
  });
  assert.equal(legitLogin.status, 200);
});

test("filtros de query (page/limit/casinoId) nao executam SQL injection", async () => {
  const token = await registerAndLoginUser({
    name: "Cliente",
    login: "cliente_sqli",
    email: "cliente.sqli@example.com",
  });

  const userRow = db.prepare("SELECT id FROM users WHERE username = ?").get("cliente_sqli");
  assert.ok(userRow?.id);

  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES ('bet365', 'Bet365', 'active')",
  ).run();
  db.prepare(
    `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
     VALUES ('e-sqli', ?, 'bet365', ?, 10, 100, 5, 2, 50)`,
  ).run(userRow.id, Date.now());

  const injectionQuery = "' OR 1=1--";

  const statsRes = await request(app)
    .get(`/me/stats?casinoId=${encodeURIComponent(injectionQuery)}&page=${injectionQuery}&limit=${injectionQuery}`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(
    statsRes.status === 200 || statsRes.status === 400,
    true,
    "Resposta deve ser 200 (com filtro ignorado) ou 400 (validacao), nunca erro 500",
  );
  assert.notEqual(statsRes.status, 500);

  const entradasRes = await request(app)
    .get(`/me/entradas?casinoId=${encodeURIComponent(injectionQuery)}&page=${injectionQuery}&limit=${injectionQuery}`)
    .set("Authorization", `Bearer ${token}`);
  assert.equal(
    entradasRes.status === 200 || entradasRes.status === 400,
    true,
    "Resposta deve ser 200 (com filtro ignorado) ou 400 (validacao), nunca erro 500",
  );
  assert.notEqual(entradasRes.status, 500);
});

test("rotas admin com filtros nao sofrem SQL injection via query params", async () => {
  const token = await registerAndLoginUser({
    name: "Admin",
    login: "admin_sqli",
    email: "admin.sqli@example.com",
    isAdmin: true,
  });

  const injectionQuery = "' OR 1=1--";

  const resUsers = await request(app)
    .get(`/admin/users?page=${injectionQuery}&limit=${injectionQuery}`)
    .set("Authorization", `Bearer ${token}`);
  assert.notEqual(resUsers.status, 500);

  const resWithdrawals = await request(app)
    .get(`/admin/withdrawals?page=${injectionQuery}&limit=${injectionQuery}`)
    .set("Authorization", `Bearer ${token}`);
  assert.notEqual(resWithdrawals.status, 500);
});

