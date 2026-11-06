import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadConfig } from "./env.js";

describe("loadConfig", () => {
  it("uses the configured port and allowed origins", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      PORT: "8080",
      DATABASE_URL: "postgresql://arsy:secret@localhost:5432/arsy",
      CORS_ORIGINS: "https://app.example.com, https://admin.example.com",
      PUBLIC_APP_URL: "https://app.example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_FROM: "no-reply@example.com",
    });

    assert.equal(config.port, 8080);
    assert.deepEqual(config.database, {
      adapter: "postgres",
      connectionString: "postgresql://arsy:secret@localhost:5432/arsy",
    });
    assert.equal(config.logLevel, "info");
    assert.deepEqual(config.corsOrigins, [
      "https://app.example.com",
      "https://admin.example.com",
    ]);
    assert.equal(config.publicAppUrl, "https://app.example.com");
    assert.deepEqual(config.smtp, {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      from: "no-reply@example.com",
    });
    assert.equal(config.rateLimitMax, 100);
    assert.equal(config.rateLimitWindowMs, 60_000);
    assert.equal(config.trustProxy, false);
    assert.equal(config.openApiEnabled, false);
  });

  it("rejects invalid ports", () => {
    assert.throws(
      () => loadConfig({ PORT: "70000" }),
      /PORT must be an integer/,
    );
  });

  it("rejects non-decimal ports", () => {
    assert.throws(
      () => loadConfig({ PORT: "0x50" }),
      /PORT must be an integer/,
    );
  });

  it("rejects empty or whitespace hosts", () => {
    assert.throws(() => loadConfig({ HOST: " " }), /HOST must be a valid/);
    assert.throws(
      () => loadConfig({ HOST: "https://api.example.com" }),
      /HOST must be a valid/,
    );
  });

  it("rejects empty CORS origin lists", () => {
    assert.throws(
      () => loadConfig({ CORS_ORIGINS: " , " }),
      /CORS_ORIGINS must contain/,
    );
  });

  it("rejects malformed CORS origins", () => {
    assert.throws(
      () => loadConfig({ CORS_ORIGINS: "https://app.example.com/path" }),
      /CORS_ORIGINS contains an invalid origin/,
    );
  });

  it("rejects wildcard CORS in production", () => {
    assert.throws(
      () =>
        loadConfig({
          NODE_ENV: "production",
          DATABASE_URL: "postgres://arsy:secret@localhost:5432/arsy",
          CORS_ORIGINS: "*",
        }),
      /CORS_ORIGINS cannot contain \*/,
    );
  });

  it("rejects duplicate CORS origins", () => {
    assert.throws(
      () =>
        loadConfig({
          CORS_ORIGINS: "https://app.example.com,https://app.example.com",
        }),
      /CORS_ORIGINS must not contain duplicates/,
    );
  });

  it("parses explicit rate limits and proxy trust", () => {
    const config = loadConfig({
      RATE_LIMIT_MAX: "250",
      RATE_LIMIT_WINDOW_MS: "30000",
      TRUST_PROXY: "10.0.0.0/8,192.168.1.10",
    });

    assert.equal(config.rateLimitMax, 250);
    assert.equal(config.rateLimitWindowMs, 30_000);
    assert.deepEqual(config.trustProxy, ["10.0.0.0/8", "192.168.1.10"]);
  });

  it("rejects invalid rate limits and proxy settings", () => {
    assert.throws(
      () => loadConfig({ RATE_LIMIT_MAX: "0" }),
      /RATE_LIMIT_MAX must be between/,
    );
    assert.throws(
      () => loadConfig({ RATE_LIMIT_WINDOW_MS: "0x10" }),
      /RATE_LIMIT_WINDOW_MS must be a positive integer/,
    );
    assert.throws(
      () => loadConfig({ TRUST_PROXY: "yes" }),
      /TRUST_PROXY must be false or a comma-separated list/,
    );
    assert.throws(
      () => loadConfig({ TRUST_PROXY: "192.168.1.1/33" }),
      /TRUST_PROXY must be false or a comma-separated list/,
    );
  });

  it("allows explicit OpenAPI visibility configuration", () => {
    assert.equal(
      loadConfig({ OPENAPI_ENABLED: "false" }).openApiEnabled,
      false,
    );
    assert.equal(
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://arsy:secret@localhost:5432/arsy",
        OPENAPI_ENABLED: "true",
        CORS_ORIGINS: "https://app.example.com",
        PUBLIC_APP_URL: "https://app.example.com",
        SMTP_HOST: "smtp.example.com",
        SMTP_FROM: "no-reply@example.com",
      }).openApiEnabled,
      true,
    );
    assert.throws(
      () => loadConfig({ OPENAPI_ENABLED: "yes" }),
      /OPENAPI_ENABLED must be true or false/,
    );
  });

  it("requires explicit CORS origins in production", () => {
    assert.throws(
      () =>
        loadConfig({
          NODE_ENV: "production",
          DATABASE_URL: "postgres://arsy:secret@localhost:5432/arsy",
        }),
      /CORS_ORIGINS must be configured in production/,
    );
  });

  it("requires secure public links and a complete production SMTP configuration", () => {
    const production = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost:5432/arsy",
      CORS_ORIGINS: "https://app.example.com",
    };

    assert.throws(
      () => loadConfig(production),
      /PUBLIC_APP_URL must be configured in production/,
    );
    assert.throws(
      () =>
        loadConfig({
          ...production,
          PUBLIC_APP_URL: "http://app.example.com",
          SMTP_HOST: "smtp.example.com",
          SMTP_FROM: "no-reply@example.com",
        }),
      /PUBLIC_APP_URL must be an HTTP\(S\) origin/,
    );
    assert.throws(
      () =>
        loadConfig({
          ...production,
          PUBLIC_APP_URL: "https://app.example.com",
        }),
      /SMTP_HOST and SMTP_FROM must be configured in production/,
    );
  });

  it("validates SMTP authentication and security settings", () => {
    assert.throws(
      () =>
        loadConfig({
          SMTP_HOST: "smtp.example.com",
          SMTP_FROM: "no-reply@example.com",
          SMTP_USER: "mailer",
        }),
      /SMTP_USER and SMTP_PASSWORD must be configured together/,
    );
    assert.throws(
      () =>
        loadConfig({
          SMTP_HOST: "smtp.example.com",
          SMTP_FROM: "no-reply@example.com",
          SMTP_SECURE: "sometimes",
        }),
      /SMTP_SECURE must be true or false/,
    );
  });

  it("uses PGlite by default outside production", () => {
    assert.deepEqual(loadConfig({ NODE_ENV: "test" }).database, {
      adapter: "pglite",
    });
    assert.deepEqual(loadConfig({ NODE_ENV: "development" }).database, {
      adapter: "pglite",
      dataDir: "./data/arsy",
    });
    assert.deepEqual(
      loadConfig({
        NODE_ENV: "development",
        PGLITE_DATA_DIR: "./data/local",
      }).database,
      { adapter: "pglite", dataDir: "./data/local" },
    );
  });

  it("requires a PostgreSQL URL for production", () => {
    assert.throws(
      () =>
        loadConfig({
          NODE_ENV: "production",
          CORS_ORIGINS: "https://app.example.com",
        }),
      /DATABASE_URL is required/,
    );
    assert.throws(
      () =>
        loadConfig({
          NODE_ENV: "production",
          CORS_ORIGINS: "https://app.example.com",
          DATABASE_URL: "https://db.example.com",
        }),
      /DATABASE_URL must be a PostgreSQL URL/,
    );
    assert.throws(
      () =>
        loadConfig({
          NODE_ENV: "production",
          CORS_ORIGINS: "https://app.example.com",
          DATABASE_URL: "postgresql:///arsy",
        }),
      /DATABASE_URL must be a PostgreSQL URL/,
    );
    assert.throws(
      () =>
        loadConfig({
          NODE_ENV: "production",
          DATABASE_ADAPTER: "pglite",
          CORS_ORIGINS: "https://app.example.com",
        }),
      /PGlite is not supported/,
    );
    assert.throws(
      () => loadConfig({ DATABASE_ADAPTER: "sqlite" }),
      /DATABASE_ADAPTER must be pglite or postgres/,
    );
    assert.throws(
      () => loadConfig({ PGLITE_DATA_DIR: " " }),
      /PGLITE_DATA_DIR must not be empty/,
    );
  });

  it("requires a strong token when Prometheus metrics are enabled", () => {
    assert.throws(
      () => loadConfig({ METRICS_ENABLED: "true" }),
      /METRICS_TOKEN must be 32 to 256 safe characters/,
    );
    assert.throws(
      () =>
        loadConfig({
          METRICS_ENABLED: "true",
          METRICS_TOKEN: "short-token",
        }),
      /METRICS_TOKEN must be 32 to 256 safe characters/,
    );
    assert.throws(
      () =>
        loadConfig({
          METRICS_ENABLED: "true",
          METRICS_TOKEN: "this token has spaces and is not safe for a header",
        }),
      /METRICS_TOKEN must be 32 to 256 safe characters/,
    );
    assert.throws(
      () => loadConfig({ METRICS_ENABLED: "yes" }),
      /METRICS_ENABLED must be true or false/,
    );
  });
});
