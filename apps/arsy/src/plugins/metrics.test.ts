import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { createApp } from "../app.js";
import { loadConfig } from "../config/env.js";

const metricsToken = randomBytes(32).toString("hex");
const metricsApp = createApp(
  loadConfig({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    METRICS_ENABLED: "true",
    METRICS_TOKEN: metricsToken,
  }),
);

before(async () => {
  await metricsApp.ready();
});

after(async () => {
  await metricsApp.close();
});

describe("Prometheus metrics endpoint", () => {
  it("requires a token and returns low-cardinality metrics when authorized", async () => {
    await metricsApp.inject({
      method: "GET",
      url: "/api/v1/health?userId=private-query-value",
    });

    const unauthorizedResponse = await metricsApp.inject({
      method: "GET",
      url: "/metrics",
    });
    const invalidTokenResponse = await metricsApp.inject({
      method: "GET",
      url: "/metrics",
      headers: { authorization: ["Bearer", "incorrect-token"].join(" ") },
    });

    assert.equal(unauthorizedResponse.statusCode, 401);
    assert.equal(unauthorizedResponse.headers["www-authenticate"], "Bearer");
    assert.equal(
      unauthorizedResponse.headers["content-type"]?.split(";")[0],
      "application/problem+json",
    );
    assert.equal(unauthorizedResponse.body.includes(metricsToken), false);
    assert.equal(invalidTokenResponse.statusCode, 401);

    const authorizedResponse = await metricsApp.inject({
      method: "GET",
      url: "/metrics",
      headers: { authorization: ["Bearer", metricsToken].join(" ") },
    });
    const metricsText = authorizedResponse.body;

    assert.equal(authorizedResponse.statusCode, 200);
    assert.match(
      authorizedResponse.headers["content-type"] ?? "",
      /text\/plain/,
    );
    assert.equal(authorizedResponse.headers["cache-control"], "no-store");
    assert.match(metricsText, /arsy_http_requests_total/);
    assert.match(metricsText, /route="\/api\/v1\/health"/);
    assert.equal(metricsText.includes("private-query-value"), false);
    assert.equal(metricsText.includes(metricsToken), false);
  });

  it("does not register the endpoint unless explicitly enabled", async () => {
    const disabledApp = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await disabledApp.ready();

      const response = await disabledApp.inject({
        method: "GET",
        url: "/metrics",
      });

      assert.equal(response.statusCode, 404);
    } finally {
      await disabledApp.close();
    }
  });

  it("applies the global rate limit to metrics scrapes", async () => {
    const limitedMetricsToken = randomBytes(32).toString("hex");
    const limitedApp = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        RATE_LIMIT_MAX: "1",
        METRICS_ENABLED: "true",
        METRICS_TOKEN: limitedMetricsToken,
      }),
    );

    try {
      await limitedApp.ready();
      const authorization = ["Bearer", limitedMetricsToken].join(" ");
      const firstResponse = await limitedApp.inject({
        method: "GET",
        url: "/metrics",
        headers: { authorization },
      });
      const secondResponse = await limitedApp.inject({
        method: "GET",
        url: "/metrics",
        headers: { authorization },
      });

      assert.equal(firstResponse.statusCode, 200);
      assert.equal(secondResponse.statusCode, 429);
    } finally {
      await limitedApp.close();
    }
  });
});
