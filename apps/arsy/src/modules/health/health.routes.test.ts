import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp } from "../../app.js";
import { loadConfig } from "../../config/env.js";

describe("health routes", () => {
  it("reports liveness, readiness, and API health", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();

      for (const [url, expected] of [
        ["/health/live", { status: "ok" }],
        ["/health/ready", { status: "ok" }],
        ["/api/v1/health", { status: "ok", service: "arsy" }],
      ] as const) {
        const response = await app.inject({ method: "GET", url });

        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.json(), expected);
      }
    } finally {
      await app.close();
    }

    assert.equal(app.database, null);
  });

  it("marks readiness unavailable when the database check fails", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      app.database.ping = async () => {
        throw new Error("database credentials must not be exposed");
      };

      const response = await app.inject({
        method: "GET",
        url: "/health/ready",
      });

      assert.equal(response.statusCode, 503);
      assert.deepEqual(response.json(), { status: "unavailable" });
      assert.equal(response.body.includes("database credentials"), false);
    } finally {
      await app.close();
    }
  });

  it("returns problem details for unknown routes without leaking query values", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/missing?token=private-value",
        headers: { "x-request-id": "health-test-id" },
      });

      assert.equal(response.statusCode, 404);
      assert.equal(
        response.headers["content-type"]?.split(";")[0],
        "application/problem+json",
      );
      assert.deepEqual(response.json(), {
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "The requested resource was not found.",
        instance: "/missing",
        requestId: "health-test-id",
      });
      assert.equal(response.body.includes("private-value"), false);
    } finally {
      await app.close();
    }
  });

  it("replaces invalid request identifiers and accepts valid ones", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();

      const validResponse = await app.inject({
        method: "GET",
        url: "/health/live",
        headers: { "x-request-id": "request-123" },
      });
      const invalidResponse = await app.inject({
        method: "GET",
        url: "/health/live",
        headers: { "x-request-id": "request id with spaces" },
      });

      assert.equal(validResponse.headers["x-request-id"], "request-123");
      assert.match(
        String(invalidResponse.headers["x-request-id"]),
        /^[0-9a-f]{8}-[0-9a-f-]{27}$/i,
      );
    } finally {
      await app.close();
    }
  });

  it("replaces request identifiers that exceed the maximum length", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/health/live",
        headers: { "x-request-id": "x".repeat(129) },
      });

      assert.notEqual(response.headers["x-request-id"], "x".repeat(129));
      assert.match(
        String(response.headers["x-request-id"]),
        /^[0-9a-f]{8}-[0-9a-f-]{27}$/i,
      );
    } finally {
      await app.close();
    }
  });

  it("returns a generic problem response for unexpected errors", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );
    app.get("/test/error", async () => {
      throw new Error("private implementation detail");
    });

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/test/error",
      });

      assert.equal(response.statusCode, 500);
      assert.equal(
        response.headers["content-type"]?.split(";")[0],
        "application/problem+json",
      );
      assert.equal(response.json().title, "Internal Server Error");
      assert.equal(response.json().detail, "An unexpected error occurred.");
      assert.equal(
        response.body.includes("private implementation detail"),
        false,
      );
    } finally {
      await app.close();
    }
  });

  it("enforces the configured request body limit", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        BODY_LIMIT_BYTES: "8",
      }),
    );
    app.post("/test/body", async () => ({ status: "ok" }));

    try {
      await app.ready();
      const response = await app.inject({
        method: "POST",
        url: "/test/body",
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ value: "too large" }),
      });

      assert.equal(response.statusCode, 413);
      assert.equal(response.json().title, "Content Too Large");
      assert.equal(response.json().status, 413);
      assert.equal(response.json().instance, "/test/body");
    } finally {
      await app.close();
    }
  });

  it("applies the configured global rate limit", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        RATE_LIMIT_MAX: "1",
      }),
    );

    try {
      await app.ready();

      const firstResponse = await app.inject({
        method: "GET",
        url: "/api/v1/health",
      });
      const secondResponse = await app.inject({
        method: "GET",
        url: "/api/v1/health",
      });

      assert.equal(firstResponse.statusCode, 200);
      assert.equal(secondResponse.statusCode, 429);
      assert.equal(secondResponse.json().title, "Too Many Requests");
    } finally {
      await app.close();
    }
  });

  it("keeps liveness and readiness probes outside the global rate limit", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        RATE_LIMIT_MAX: "1",
      }),
    );

    try {
      await app.ready();

      for (const url of ["/health/live", "/health/ready"]) {
        const firstResponse = await app.inject({ method: "GET", url });
        const secondResponse = await app.inject({ method: "GET", url });

        assert.equal(firstResponse.statusCode, 200);
        assert.equal(secondResponse.statusCode, 200);
      }
    } finally {
      await app.close();
    }
  });

  it("serves OpenAPI documentation when enabled", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        OPENAPI_ENABLED: "true",
      }),
    );

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/documentation/json",
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.json().openapi, "3.1.0");
      assert.equal(response.json().info.title, "Arsy API");
    } finally {
      await app.close();
    }
  });

  it("does not register OpenAPI routes when disabled", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        OPENAPI_ENABLED: "false",
      }),
    );

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/documentation/json",
      });

      assert.equal(response.statusCode, 404);
      assert.equal(response.json().title, "Not Found");
    } finally {
      await app.close();
    }
  });

  it("does not grant CORS access to unconfigured origins", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        CORS_ORIGINS: "https://app.example.com",
      }),
    );

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/health/live",
        headers: { origin: "https://untrusted.example.com" },
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers["access-control-allow-origin"], undefined);
    } finally {
      await app.close();
    }
  });

  it("returns problem details for malformed JSON requests", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );
    app.post("/test/json", async () => ({ status: "ok" }));

    try {
      await app.ready();
      const response = await app.inject({
        method: "POST",
        url: "/test/json",
        headers: { "content-type": "application/json" },
        payload: "{invalid",
      });

      assert.equal(response.statusCode, 400);
      assert.equal(
        response.headers["content-type"]?.split(";")[0],
        "application/problem+json",
      );
      assert.equal(response.json().status, 400);
      assert.equal(response.json().instance, "/test/json");
    } finally {
      await app.close();
    }
  });

  it("sets security headers and allows configured CORS origins", async () => {
    const app = createApp(
      loadConfig({
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        CORS_ORIGINS: "https://app.example.com",
      }),
    );

    try {
      await app.ready();
      const response = await app.inject({
        method: "GET",
        url: "/health/live",
        headers: { origin: "https://app.example.com" },
      });

      assert.equal(response.headers["x-content-type-options"], "nosniff");
      assert.equal(response.headers["x-frame-options"], "SAMEORIGIN");
      assert.equal(
        response.headers["access-control-allow-origin"],
        "https://app.example.com",
      );
      assert.equal(
        response.headers["access-control-allow-credentials"],
        undefined,
      );
    } finally {
      await app.close();
    }
  });
});
