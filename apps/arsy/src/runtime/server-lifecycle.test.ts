import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";

import { createApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import { startServer } from "./server-lifecycle.js";

describe("server lifecycle", () => {
  it("listens and shuts down idempotently", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );
    const signals = new EventEmitter();
    let closed = false;
    app.addHook("onClose", async () => {
      closed = true;
    });
    const lifecycle = await startServer(
      app,
      {
        host: "127.0.0.1",
        port: 0,
        shutdownTimeoutMs: 1_000,
      },
      signals,
    );

    assert.equal(app.server.listening, true);
    assert.equal(signals.listenerCount("SIGINT"), 1);
    assert.equal(signals.listenerCount("SIGTERM"), 1);

    signals.emit("SIGTERM");
    await lifecycle.shutdown();

    assert.equal(app.server.listening, false);
    assert.equal(closed, true);
    assert.equal(signals.listenerCount("SIGINT"), 0);
    assert.equal(signals.listenerCount("SIGTERM"), 0);
  });
});
