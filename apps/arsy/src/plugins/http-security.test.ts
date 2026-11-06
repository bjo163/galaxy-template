import assert from "node:assert/strict";
import { test } from "node:test";

import Fastify from "fastify";

import { loadConfig } from "../config/env.js";
import { registerHttpSecurity } from "./http-security.js";

async function getContentSecurityPolicy(
  nodeEnv: "development" | "test",
): Promise<string> {
  const app = Fastify({ logger: false });

  try {
    registerHttpSecurity(
      app,
      loadConfig({
        NODE_ENV: nodeEnv,
        CORS_ORIGINS: "https://console.example.com",
      }),
    );
    app.get("/test", () => ({ ok: true }));

    const response = await app.inject("/test");
    const policy = response.headers["content-security-policy"];

    assert.equal(response.statusCode, 200);
    if (typeof policy !== "string") {
      throw new Error("Content-Security-Policy header is missing.");
    }

    return policy;
  } finally {
    await app.close();
  }
}

test("allows Vite development workers without widening script sources", async () => {
  const policy = await getContentSecurityPolicy("development");

  assert.match(policy, /worker-src 'self' blob:/);
  assert.match(policy, /script-src 'self'/);
});

test("does not allow blob workers outside development", async () => {
  const policy = await getContentSecurityPolicy("test");

  assert.doesNotMatch(policy, /worker-src[^;]*blob:/);
});
