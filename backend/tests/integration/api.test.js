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
  password = "Senha1234",
  isAdmin = false,
}) {
  const registerRes = await request(app).post("/register").send({
    name,
    login,
    email,
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
    password: "Senha1234",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Usuario registrado com sucesso.");
  assert.equal(typeof res.body.token, "string");
  assert.equal(res.body.user.email, "teste@example.com");
});

test("POST /login falha com senha invalida", async () => {
  await request(app).post("/register").send({
    name: "Teste Usuario",
    login: "teste_user",
    email: "teste@example.com",
    password: "Senha1234",
  });

  const res = await request(app).post("/login").send({
    login: "teste_user",
    password: "SenhaErrada999",
  });

  assert.equal(res.status, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
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
