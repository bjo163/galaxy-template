import assert from "node:assert/strict";
import { test } from "node:test";

import Fastify from "fastify";

import { registerConsole } from "./register-console.js";

test("serves the console shell through Fastify Vite", async () => {
  const app = Fastify({ logger: false });

  try {
    await registerConsole(app, true);

    const response = await app.inject("/");

    assert.equal(response.statusCode, 200);
    assert.match(response.headers["content-type"] ?? "", /text\/html/);
    assert.match(response.body, /Arsy Console/);
  } finally {
    await app.close();
  }
});
