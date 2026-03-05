/**
 * Testes de integração do fluxo CAPTCHA (reCAPTCHA v2).
 * - Em NODE_ENV=test o CAPTCHA não é exigido no registro (isCaptchaEnabled false).
 * - Registro aceita captchaToken opcional; quando enviado, verifyRecaptcha em test retorna true.
 * - Login após 3 falhas: em test o CAPTCHA não é exigido (comportamento desligado para testes).
 */

import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { isCaptchaEnabled } from "../../utils/captcha.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.DB_PATH = path.join(
  os.tmpdir(),
  `iafiliado-captcha-test-${Date.now()}-${Math.round(Math.random() * 1e6)}.db`,
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

test("isCaptchaEnabled retorna false em NODE_ENV=test", () => {
  assert.equal(process.env.NODE_ENV, "test");
  assert.equal(isCaptchaEnabled(), false);
});

test("POST /register sem captchaToken funciona em ambiente test", async () => {
  const res = await request(app)
    .post("/register")
    .send({
      name: "Usuario Captcha",
      login: "captcha_user",
      email: "captcha@example.com",
      cpfCnpj: "12345678909",
      password: "Senha1234",
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Usuario registrado com sucesso.");
  assert.ok(res.body.token);
  assert.equal(res.body.user?.email, "captcha@example.com");
});

test("POST /register com captchaToken opcional funciona em ambiente test", async () => {
  const res = await request(app)
    .post("/register")
    .send({
      name: "Usuario Com Captcha",
      login: "captcha_token_user",
      email: "captcha2@example.com",
      cpfCnpj: "98765432100",
      password: "Senha1234",
      captchaToken: "token-teste-fake",
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Usuario registrado com sucesso.");
  assert.ok(res.body.token);
  assert.equal(res.body.user?.email, "captcha2@example.com");
});

test("POST /login em test nao exige CAPTCHA apos multiplas falhas (comportamento desligado)", async () => {
  await request(app).post("/register").send({
    name: "Login Captcha",
    login: "login_captcha",
    email: "login_captcha@example.com",
    cpfCnpj: "11122233344",
    password: "Senha1234",
  });

  for (let i = 0; i < 3; i++) {
    await request(app)
      .post("/login")
      .send({ login: "login_captcha", password: "SenhaErrada" });
  }

  const res = await request(app)
    .post("/login")
    .send({ login: "login_captcha", password: "Senha1234" });

  assert.equal(res.status, 200, "Em test o login deve funcionar sem enviar captchaToken mesmo apos falhas");
  assert.ok(res.body.token);
});
