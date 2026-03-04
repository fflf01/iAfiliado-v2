/**
 * Testes de segurança: transmissão de senha no login.
 *
 * Verifica a afirmação: "As senhas estão sendo enviadas em texto plano no payload
 * das requisições de login" e se a aplicação evita registrar a senha em logs.
 *
 * Conclusões esperadas:
 * - A senha é enviada no body da requisição (padrão HTTP para login; proteção é HTTPS).
 * - A senha NÃO deve aparecer em nenhum log do servidor (console.log/warn/error).
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
  `iafiliado-pwd-security-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`,
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

// Senha única usada para garantir que, se vazar em log, o teste detecte
const SENHA_TESTE_LOG = "SenhaSecreta_NuncaLogar_XYZ_" + Date.now();

test("POST /login envia senha no body (evidência: payload em JSON; proteção é HTTPS)", async () => {
  await request(app).post("/register").send({
    name: "Usuario Teste",
    login: "login_seguranca",
    email: "seguranca@example.com",
    cpfCnpj: "12345678909",
    password: SENHA_TESTE_LOG,
  });

  const res = await request(app)
    .post("/login")
    .set("Content-Type", "application/json")
    .send({
      login: "seguranca@example.com",
      password: SENHA_TESTE_LOG,
    });

  assert.equal(res.status, 200, "Login deve funcionar com senha no body");
  assert.ok(res.body.token, "Resposta deve conter token");
  assert.ok(res.body.user, "Resposta deve conter user");
  assert.equal(res.body.user.email, "seguranca@example.com");
  // A API nunca retorna senha nem hash
  assert.equal(res.body.user.password, undefined);
  assert.equal(res.body.user.password_hash, undefined);
});

test("POST /login NÃO registra a senha em logs do servidor", async () => {
  const logChunks = [];
  const pushChunk = (method, args) => {
    const str = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    logChunks.push(str);
  };

  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args) => {
    pushChunk("log", args);
    origLog.apply(console, args);
  };
  console.warn = (...args) => {
    pushChunk("warn", args);
    origWarn.apply(console, args);
  };
  console.error = (...args) => {
    pushChunk("error", args);
    origError.apply(console, args);
  };

  try {
    await request(app).post("/register").send({
      name: "Usuario Log",
      login: "user_log",
      email: "log@example.com",
      cpfCnpj: "98765432100",
      password: SENHA_TESTE_LOG,
    });

    await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({
        login: "log@example.com",
        password: SENHA_TESTE_LOG,
      });

    const concatenated = logChunks.join("\n");
    assert.ok(
      !concatenated.includes(SENHA_TESTE_LOG),
      `A senha do usuário NÃO deve aparecer em nenhum log do servidor. Logs capturados (trecho): ${concatenated.slice(0, 500)}`,
    );
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
});

test("bloqueio temporario apos 5 tentativas falhas na mesma conta", async () => {
  await request(app).post("/register").send({
    name: "Usuario Lock",
    login: "lock_user",
    email: "lock@example.com",
    cpfCnpj: "11122233344",
    password: "SenhaCorreta123",
  });

  for (let i = 0; i < 5; i++) {
    const res = await request(app).post("/login").send({
      login: "lock@example.com",
      password: "SenhaErrada",
    });
    assert.equal(res.status, 401);
  }

  const lockedRes = await request(app).post("/login").send({
    login: "lock@example.com",
    password: "SenhaCorreta123",
  });
  assert.equal(lockedRes.status, 403);
  assert.ok(
    lockedRes.body?.error?.includes("bloqueada") || lockedRes.body?.error?.includes("minuto"),
    "Resposta deve informar bloqueio temporario",
  );
});
