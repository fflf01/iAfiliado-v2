import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../../config/env.js";

function withEnv(overrides, fn) {
  const keys = new Set([...Object.keys(overrides)]);
  const previous = {};
  for (const key of keys) {
    previous[key] = process.env[key];
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }

  try {
    return fn();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

function captureError(fn) {
  try {
    fn();
    return null;
  } catch (err) {
    return err;
  }
}

test("loadEnv bloqueia producao sem CORS_ORIGINS", () => {
  withEnv(
    {
      NODE_ENV: "production",
      JWT_SECRET: "12345678901234567890123456789012",
      CORS_ORIGINS: null,
    },
    () => {
      const err = captureError(() => loadEnv());
      assert.ok(err);
      assert.equal(err.code, "ENV_MISSING");
      assert.match(err.message, /CORS_ORIGINS/i);
    },
  );
});

test("loadEnv bloqueia CORS_ORIGINS com URL invalida", () => {
  withEnv(
    {
      NODE_ENV: "production",
      JWT_SECRET: "12345678901234567890123456789012",
      CORS_ORIGINS: "nao-e-url",
    },
    () => {
      const err = captureError(() => loadEnv());
      assert.ok(err);
      assert.equal(err.code, "ENV_INVALID");
    },
  );
});

test("loadEnv aceita CORS_ORIGINS explicito em producao", () => {
  withEnv(
    {
      NODE_ENV: "production",
      JWT_SECRET: "12345678901234567890123456789012",
      CORS_ORIGINS: "https://app.exemplo.com,https://admin.exemplo.com",
      PORT: "3000",
    },
    () => {
      const env = loadEnv();
      assert.equal(env.isProduction, true);
      assert.deepEqual(env.corsOrigins, [
        "https://app.exemplo.com",
        "https://admin.exemplo.com",
      ]);
    },
  );
});
