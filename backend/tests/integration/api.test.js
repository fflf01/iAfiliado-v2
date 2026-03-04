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
  `iafiliado-test-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`,
);

let app;
let db;
let invalidUploadPath;

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
  invalidUploadPath = path.join(
    os.tmpdir(),
    `iafiliado-invalid-upload-${Date.now()}-${Math.round(Math.random() * 1e6)}.txt`,
  );
  fs.writeFileSync(invalidUploadPath, "arquivo invalido para teste");
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

  if (invalidUploadPath && fs.existsSync(invalidUploadPath)) {
    fs.unlinkSync(invalidUploadPath);
  }
});

test("POST /register cria usuario e retorna token", async () => {
  const res = await request(app).post("/register").send({
    name: "Teste Usuario",
    login: "teste_user",
    email: "teste@example.com",
    cpfCnpj: "123.456.789-09",
    password: "Senha1234",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Usuario registrado com sucesso.");
  assert.equal(typeof res.body.token, "string");
  assert.equal(res.body.user.email, "teste@example.com");
  assert.equal(res.body.user.cpf_cnpj, "12345678909");
});

test("POST /login retorna Set-Cookie HttpOnly (auth_token)", async () => {
  await request(app).post("/register").send({
    name: "Teste Usuario",
    login: "cookie_user",
    email: "cookie@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });
  const res = await request(app).post("/login").send({
    login: "cookie_user",
    password: "Senha1234",
  });
  assert.equal(res.status, 200);
  const setCookie = res.headers["set-cookie"];
  assert.ok(Array.isArray(setCookie) && setCookie.length > 0);
  assert.ok(setCookie[0].includes("auth_token="));
  assert.ok(setCookie[0].toLowerCase().includes("httponly"));
  assert.ok(setCookie[0].toLowerCase().includes("samesite=strict"));
});

test("POST /login falha com senha invalida", async () => {
  await request(app).post("/register").send({
    name: "Teste Usuario",
    login: "teste_user",
    email: "teste@example.com",
    cpfCnpj: "12345678909",
    password: "Senha1234",
  });

  const res = await request(app).post("/login").send({
    login: "teste_user",
    password: "SenhaErrada999",
  });

  assert.equal(res.status, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
});

test("POST /logout limpa cookie e retorna 204", async () => {
  const res = await request(app).post("/logout");
  assert.equal(res.status, 204);
  const setCookie = res.headers["set-cookie"];
  assert.ok(Array.isArray(setCookie) && setCookie.length > 0);
  assert.ok(setCookie[0].includes("auth_token=;") || setCookie[0].toLowerCase().includes("max-age=0"));
});

test("POST /support exige subject ou title", async () => {
  const res = await request(app).post("/support").send({
    name: "Visitante",
    email: "visitante@example.com",
    message: "Mensagem valida",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.code, "VALIDATION_ERROR");
  assert.match(res.body.error, /subject ou title/i);
});

test("POST /support cria ticket publico com sucesso", async () => {
  const res = await request(app).post("/support").send({
    name: "Visitante",
    email: "visitante@example.com",
    title: "Ajuda",
    message: "Preciso de suporte",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Ticket criado com sucesso!");
  assert.match(res.body.id, /^SUP-\d+$/);
});

test("POST /support rejeita upload com tipo de arquivo nao permitido", async () => {
  const res = await request(app)
    .post("/support")
    .field("name", "Visitante")
    .field("email", "visitante@example.com")
    .field("title", "Arquivo invalido")
    .field("message", "Tentativa com upload invalido")
    .attach("attachments", invalidUploadPath);

  assert.equal(res.status, 400);
  assert.equal(res.body.code, "UPLOAD_FILETYPE");
});

test("GET /support/messages bloqueia usuario nao-admin", async () => {
  const token = await registerAndLoginUser({
    name: "Nao Admin",
    login: "nao_admin",
    email: "naoadmin@example.com",
  });

  const res = await request(app)
    .get("/support/messages")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 403);
  assert.equal(res.body.code, "FORBIDDEN");
});

test("PUT /support/messages/:id valida id invalido", async () => {
  const token = await registerAndLoginUser({
    name: "Admin",
    login: "admin_user",
    email: "admin@example.com",
    isAdmin: true,
  });

  const res = await request(app).put("/support/messages/abc").set("Authorization", `Bearer ${token}`).send({ status: "aberto" });

  assert.equal(res.status, 400);
  assert.equal(res.body.code, "VALIDATION_ERROR");
});

test("PUT /support/messages/:id retorna 404 para ticket inexistente", async () => {
  const token = await registerAndLoginUser({
    name: "Admin",
    login: "admin_inexistente",
    email: "admin.inexistente@example.com",
    isAdmin: true,
  });

  const res = await request(app)
    .put("/support/messages/999999")
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "aberto" });

  assert.equal(res.status, 404);
  assert.equal(res.body.code, "NOT_FOUND");
});

test("GET /admin bloqueia sem token", async () => {
  const res = await request(app).get("/admin");
  assert.equal(res.status, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
});

test("POST /support/ticket exige autenticacao", async () => {
  const res = await request(app).post("/support/ticket").send({
    name: "Cliente sem auth",
    email: "cliente.sem.auth@example.com",
    title: "Ticket sem token",
    message: "Deve falhar por falta de autenticacao",
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
});

test("GET /admin permite usuario admin", async () => {
  const token = await registerAndLoginUser({
    name: "Admin",
    login: "super_admin",
    email: "superadmin@example.com",
    isAdmin: true,
  });

  const res = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.message, "Bem-vindo, admin.");
});

test("POST /support/ticket cria ticket autenticado e GET /support/my-messages lista ticket", async () => {
  const token = await registerAndLoginUser({
    name: "Cliente",
    login: "cliente_1",
    email: "cliente1@example.com",
  });

  const createRes = await request(app)
    .post("/support/ticket")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Cliente",
      email: "cliente1@example.com",
      title: "Titulo ticket",
      message: "Preciso de ajuda com minha conta",
    });

  assert.equal(createRes.status, 201);
  assert.match(createRes.body.id, /^SUP-\d+$/);

  const listRes = await request(app)
    .get("/support/my-messages")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(listRes.status, 200);
  assert.equal(Array.isArray(listRes.body), true);
  assert.equal(listRes.body.length, 1);
  assert.equal(listRes.body[0].subject, "Titulo ticket");
});

test("listagens pesadas aplicam paginacao por page/limit", async () => {
  const adminToken = await registerAndLoginUser({
    name: "Admin Paginacao",
    login: "admin_paginacao",
    email: "admin.paginacao@example.com",
    isAdmin: true,
  });
  const clientToken = await registerAndLoginUser({
    name: "Cliente Paginacao",
    login: "cliente_paginacao",
    email: "cliente.paginacao@example.com",
  });
  const clientRow = db.prepare("SELECT id FROM users WHERE username = ?").get("cliente_paginacao");
  assert.ok(clientRow?.id);

  let firstTicketId = null;
  for (let i = 0; i < 5; i += 1) {
    const info = db.prepare(
      `INSERT INTO support_messages (name, email, subject, message, user_id)
       VALUES (?, ?, ?, ?, ?)`,
    ).run("Cliente Paginacao", "cliente.paginacao@example.com", `Assunto ${i}`, `Mensagem ${i}`, clientRow.id);
    if (firstTicketId == null) firstTicketId = Number(info.lastInsertRowid);
  }
  assert.ok(firstTicketId);

  for (let i = 0; i < 5; i += 1) {
    db.prepare(
      `INSERT INTO support_replies (ticket_id, user_id, sender_type, message)
       VALUES (?, ?, 'user', ?)`,
    ).run(firstTicketId, clientRow.id, `Resposta ${i}`);
  }

  for (let i = 0; i < 4; i += 1) {
    db.prepare(
      `INSERT INTO withdrawal_requests (id, user_id, valor, metodo, status)
       VALUES (?, ?, ?, 'PIX', 'pendente')`,
    ).run(`wr-pag-${i}`, clientRow.id, 100 + i);
  }

  const supportMessagesRes = await request(app)
    .get("/support/messages?page=1&limit=2")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(supportMessagesRes.status, 200);
  assert.equal(Array.isArray(supportMessagesRes.body), true);
  assert.equal(supportMessagesRes.body.length, 2);

  const myMessagesRes = await request(app)
    .get("/support/my-messages?page=2&limit=2")
    .set("Authorization", `Bearer ${clientToken}`);
  assert.equal(myMessagesRes.status, 200);
  assert.equal(Array.isArray(myMessagesRes.body), true);
  assert.equal(myMessagesRes.body.length, 2);

  const repliesRes = await request(app)
    .get(`/support/ticket/${firstTicketId}/replies?page=2&limit=2`)
    .set("Authorization", `Bearer ${clientToken}`);
  assert.equal(repliesRes.status, 200);
  assert.equal(Array.isArray(repliesRes.body), true);
  assert.equal(repliesRes.body.length, 2);

  const clientsRes = await request(app)
    .get("/clients?page=1&limit=1")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(clientsRes.status, 200);
  assert.equal(Array.isArray(clientsRes.body), true);
  assert.equal(clientsRes.body.length, 1);

  const withdrawalsRes = await request(app)
    .get("/admin/withdrawals?page=1&limit=3")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(withdrawalsRes.status, 200);
  assert.equal(Array.isArray(withdrawalsRes.body), true);
  assert.equal(withdrawalsRes.body.length, 3);
});

test("POST /support/ticket/:id/reply bloqueia acesso a ticket de outro usuario", async () => {
  const ownerToken = await registerAndLoginUser({
    name: "Owner",
    login: "owner_user",
    email: "owner@example.com",
  });
  const outsiderToken = await registerAndLoginUser({
    name: "Outsider",
    login: "outsider_user",
    email: "outsider@example.com",
  });

  const createRes = await request(app)
    .post("/support/ticket")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      name: "Owner",
      email: "owner@example.com",
      title: "Ticket privado",
      message: "Conteudo do ticket",
    });
  assert.equal(createRes.status, 201);
  const numericId = Number(createRes.body.id.replace("SUP-", ""));

  const replyRes = await request(app)
    .post(`/support/ticket/${numericId}/reply`)
    .set("Authorization", `Bearer ${outsiderToken}`)
    .send({ message: "Tentativa sem permissao" });

  assert.equal(replyRes.status, 403);
  assert.equal(replyRes.body.code, "FORBIDDEN");
});

test("todas respostas de erro retornam requestId", async () => {
  const res = await request(app).post("/login").send({ login: "sem_usuario", password: "123" });
  assert.equal(res.status, 401);
  assert.equal(typeof res.body.requestId, "string");
  assert.ok(res.body.requestId.length > 0);
});

test("GET /me/casas lista casas vinculadas do usuario", async () => {
  const token = await registerAndLoginUser({
    name: "Cliente",
    login: "cliente_casas",
    email: "cliente.casas@example.com",
  });

  const userRow = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("cliente_casas");
  assert.ok(userRow?.id);

  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES (?, ?, 'active')",
  ).run("bet365", "Bet365");
  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES (?, ?, 'active')",
  ).run("betano", "Betano");

  db.prepare(
    "INSERT INTO affiliate_casinos (id, user_id, casino_id, status, link) VALUES (?, ?, ?, 'active', ?)",
  ).run("ac-1", userRow.id, "bet365", "https://example.com/ref/bet365");
  db.prepare(
    "INSERT INTO affiliate_casinos (id, user_id, casino_id, status, link) VALUES (?, ?, ?, 'inactive', ?)",
  ).run("ac-2", userRow.id, "betano", "https://example.com/ref/betano");

  const res = await request(app)
    .get("/me/casas")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body.length, 2);

  const bet365 = res.body.find((c) => c.casinoId === "bet365");
  assert.equal(bet365.casinoName, "Bet365");
  assert.equal(bet365.status, "active");
});

test("POST /me/contracts cria solicitacao quando usuario logado e casa existe (fluxo botao Acessar)", async () => {
  db.prepare(
    "INSERT INTO casinos (id, name, url, url_afiliado, comissao_cpa, comissao_revshare, status) VALUES (?, ?, NULL, NULL, 0, 11, 'active')",
  ).run("brasilbet", "BrasilBet");

  const token = await registerAndLoginUser({
    name: "Afiliado",
    login: "afiliado_contrato",
    email: "afiliado.contrato@example.com",
  });

  const res = await request(app)
    .post("/me/contracts")
    .set("Authorization", `Bearer ${token}`)
    .send({ platformName: "BrasilBet" });

  assert.equal(res.status, 201, "esperado 201 ao solicitar contrato");
  assert.equal(res.body.ok, true);
  assert.equal(typeof res.body.id, "string");
  assert.equal(res.body.status, "pendente");

  const row = db.prepare("SELECT * FROM contracts WHERE casa_id = 'brasilbet'").get();
  assert.ok(row);
  assert.equal(row.status, "pendente");
});

test("POST /me/contracts sem auth retorna 401", async () => {
  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES ('betsul', 'BetSul', 'active')",
  ).run();

  const res = await request(app)
    .post("/me/contracts")
    .send({ platformName: "BetSul" });

  assert.equal(res.status, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
});

test("GET /me/stats e /me/entradas aceitam filtro casinoId", async () => {
  const token = await registerAndLoginUser({
    name: "Cliente",
    login: "cliente_filtro",
    email: "cliente.filtro@example.com",
  });

  const userRow = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("cliente_filtro");
  assert.ok(userRow?.id);

  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES (?, ?, 'active')",
  ).run("bet365", "Bet365");
  db.prepare(
    "INSERT INTO casinos (id, name, status) VALUES (?, ?, 'active')",
  ).run("stake", "Stake");

  const now = Date.now();
  db.prepare(
    `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run("e-1", userRow.id, "bet365", now, 10, 100, 5, 2, 30.5);

  db.prepare(
    `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run("e-2", userRow.id, "stake", now, 7, 50, 2, 1, 10);

  const statsRes = await request(app)
    .get("/me/stats?casinoId=bet365")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(statsRes.status, 200);
  assert.equal(statsRes.body.totalDepositos, 10);
  assert.equal(statsRes.body.totalCliques, 100);
  assert.equal(statsRes.body.totalFtds, 2);
  assert.equal(statsRes.body.comissaoTotal, 30.5);

  const entradasRes = await request(app)
    .get("/me/entradas?casinoId=bet365")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(entradasRes.status, 200);
  assert.equal(Array.isArray(entradasRes.body), true);
  assert.equal(entradasRes.body.length, 1);
  assert.equal(entradasRes.body[0].casinoId, "bet365");
  assert.equal(entradasRes.body[0].casinoName, "Bet365");
});
