import { isIP } from "node:net";

const logLevels = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

type LogLevel = (typeof logLevels)[number];

function isLogLevel(value: string): value is LogLevel {
  return (logLevels as readonly string[]).includes(value);
}

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  database:
    | { adapter: "pglite"; dataDir?: string }
    | {
        adapter: "postgres";
        connectionString: string;
        pool: {
          min: number;
          max: number;
          acquireTimeoutMillis: number;
          idleTimeoutMillis: number;
          createTimeoutMillis: number;
        };
      };
  host: string;
  port: number;
  logLevel: LogLevel;
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
  trustProxy: boolean | string[];
  requestTimeoutMs: number;
  bodyLimitBytes: number;
  shutdownTimeoutMs: number;
  openApiEnabled: boolean;
  metricsEnabled: boolean;
  metricsToken: string;
};

function positiveInteger(
  value: string | undefined,
  fallback: number,
  variableName: string,
  maximum: number,
): number {
  const requestedValue = value ?? String(fallback);

  if (!/^\d+$/.test(requestedValue)) {
    throw new Error(`${variableName} must be a positive integer`);
  }

  const parsedValue = Number(requestedValue);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > maximum
  ) {
    throw new Error(`${variableName} must be between 1 and ${maximum}`);
  }

  return parsedValue;
}

function isValidProxyAddress(value: string): boolean {
  const [address, prefix, ...extra] = value.split("/");

  if (extra.length > 0) {
    return false;
  }

  const addressFamily = isIP(address);

  if (addressFamily === 0) {
    return false;
  }

  if (prefix === undefined) {
    return true;
  }

  if (!/^\d+$/.test(prefix)) {
    return false;
  }

  const prefixLength = Number(prefix);
  const maxPrefixLength = addressFamily === 4 ? 32 : 128;

  return prefixLength >= 0 && prefixLength <= maxPrefixLength;
}

function isValidHost(value: string): boolean {
  if (isIP(value) > 0) {
    return true;
  }

  if (value.length > 253) {
    return false;
  }

  return value
    .split(".")
    .every((label) =>
      /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label),
    );
}

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const nodeEnv = environment.NODE_ENV ?? "development";

  if (
    nodeEnv !== "development" &&
    nodeEnv !== "test" &&
    nodeEnv !== "production"
  ) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const databaseAdapter =
    environment.DATABASE_ADAPTER ??
    (nodeEnv === "production" ? "postgres" : "pglite");
  if (databaseAdapter !== "pglite" && databaseAdapter !== "postgres") {
    throw new Error("DATABASE_ADAPTER must be pglite or postgres");
  }

  let database: AppConfig["database"];
  if (databaseAdapter === "postgres") {
    const connectionString = environment.DATABASE_URL?.trim();
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for the postgres adapter");
    }

    let parsedDatabaseUrl: URL;
    try {
      parsedDatabaseUrl = new URL(connectionString);
    } catch {
      throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
    }

    if (
      (parsedDatabaseUrl.protocol !== "postgres:" &&
        parsedDatabaseUrl.protocol !== "postgresql:") ||
      !parsedDatabaseUrl.hostname
    ) {
      throw new Error("DATABASE_URL must be a PostgreSQL URL with a hostname");
    }

    const poolMin = positiveInteger(environment.DB_POOL_MIN, 2, "DB_POOL_MIN", 50);
    const poolMax = positiveInteger(environment.DB_POOL_MAX, 10, "DB_POOL_MAX", 100);
    if (poolMin > poolMax) throw new Error("DB_POOL_MIN must not exceed DB_POOL_MAX");
    database = {
      adapter: "postgres",
      connectionString,
      pool: {
        min: poolMin,
        max: poolMax,
        acquireTimeoutMillis: positiveInteger(environment.DB_POOL_ACQUIRE_TIMEOUT_MS, 30_000, "DB_POOL_ACQUIRE_TIMEOUT_MS", 120_000),
        idleTimeoutMillis: positiveInteger(environment.DB_POOL_IDLE_TIMEOUT_MS, 10_000, "DB_POOL_IDLE_TIMEOUT_MS", 120_000),
        createTimeoutMillis: positiveInteger(environment.DB_POOL_CREATE_TIMEOUT_MS, 30_000, "DB_POOL_CREATE_TIMEOUT_MS", 120_000),
      },
    };
  } else {
    if (nodeEnv === "production") {
      throw new Error("PGlite is not supported as Arsy's production database");
    }

    const dataDirValue =
      environment.PGLITE_DATA_DIR?.trim() ??
      (nodeEnv === "development" ? "./data/arsy" : undefined);
    if (environment.PGLITE_DATA_DIR !== undefined && !dataDirValue) {
      throw new Error("PGLITE_DATA_DIR must not be empty");
    }

    database = {
      adapter: "pglite",
      ...(dataDirValue ? { dataDir: dataDirValue } : {}),
    };
  }

  const openApiEnabledValue =
    environment.OPENAPI_ENABLED ??
    (nodeEnv === "production" ? "false" : "true");

  if (openApiEnabledValue !== "true" && openApiEnabledValue !== "false") {
    throw new Error("OPENAPI_ENABLED must be true or false");
  }

  const metricsEnabledValue = environment.METRICS_ENABLED ?? "false";

  if (metricsEnabledValue !== "true" && metricsEnabledValue !== "false") {
    throw new Error("METRICS_ENABLED must be true or false");
  }

  const metricsEnabled = metricsEnabledValue === "true";
  const metricsToken = environment.METRICS_TOKEN ?? "";

  if (
    metricsEnabled &&
    (!/^[A-Za-z0-9._~-]{32,256}$/.test(metricsToken) ||
      Buffer.byteLength(metricsToken) < 32)
  ) {
    throw new Error(
      "METRICS_TOKEN must be 32 to 256 safe characters when metrics are enabled",
    );
  }

  const portVariableName = environment.ARSY_PORT !== undefined ? "ARSY_PORT" : "PORT";
  const requestedPort = environment.ARSY_PORT ?? environment.PORT ?? "3001";

  if (!/^\d+$/.test(requestedPort)) {
    throw new Error(`${portVariableName} must be an integer between 1 and 65535`);
  }

  const port = Number(requestedPort);

  if (port < 1 || port > 65535) {
    throw new Error(`${portVariableName} must be an integer between 1 and 65535`);
  }

  const host = environment.HOST ?? "0.0.0.0";

  if (!isValidHost(host)) {
    throw new Error("HOST must be a valid hostname or IP address");
  }

  const trustProxyValue = environment.TRUST_PROXY ?? "false";

  let trustProxy: boolean | string[];

  if (trustProxyValue === "false") {
    trustProxy = false;
  } else {
    const trustedProxies = trustProxyValue
      .split(",")
      .map((proxy) => proxy.trim())
      .filter(Boolean);

    if (
      trustedProxies.length === 0 ||
      trustedProxies.length > 20 ||
      new Set(trustedProxies).size !== trustedProxies.length ||
      trustedProxies.some((proxy) => !isValidProxyAddress(proxy))
    ) {
      throw new Error(
        "TRUST_PROXY must be false or a comma-separated list of valid IP addresses or CIDRs",
      );
    }

    trustProxy = trustedProxies;
  }

  const requestedLogLevel =
    environment.LOG_LEVEL ?? (nodeEnv === "production" ? "info" : "debug");

  if (!isLogLevel(requestedLogLevel)) {
    throw new Error(`LOG_LEVEL is invalid: ${requestedLogLevel}`);
  }

  const configuredCorsOrigins = environment.CORS_ORIGINS;

  if (nodeEnv === "production" && !configuredCorsOrigins) {
    throw new Error("CORS_ORIGINS must be configured in production");
  }

  const corsOrigins = (
    configuredCorsOrigins ?? "http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGINS must contain at least one origin");
  }

  if (new Set(corsOrigins).size !== corsOrigins.length) {
    throw new Error("CORS_ORIGINS must not contain duplicates");
  }

  for (const origin of corsOrigins) {
    if (origin === "*") {
      if (nodeEnv === "production") {
        throw new Error("CORS_ORIGINS cannot contain * in production");
      }

      continue;
    }

    let parsedOrigin: URL;

    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGINS contains an invalid origin: ${origin}`);
    }

    if (
      (parsedOrigin.protocol !== "http:" &&
        parsedOrigin.protocol !== "https:") ||
      parsedOrigin.origin !== origin
    ) {
      throw new Error(`CORS_ORIGINS contains an invalid origin: ${origin}`);
    }
  }

  return {
    nodeEnv,
    database,
    host,
    port,
    logLevel: requestedLogLevel,
    corsOrigins,
    rateLimitMax: positiveInteger(
      environment.RATE_LIMIT_MAX,
      100,
      "RATE_LIMIT_MAX",
      1_000_000,
    ),
    rateLimitWindowMs: positiveInteger(
      environment.RATE_LIMIT_WINDOW_MS,
      60_000,
      "RATE_LIMIT_WINDOW_MS",
      86_400_000,
    ),
    trustProxy,
    requestTimeoutMs: positiveInteger(
      environment.REQUEST_TIMEOUT_MS,
      30_000,
      "REQUEST_TIMEOUT_MS",
      120_000,
    ),
    bodyLimitBytes: positiveInteger(
      environment.BODY_LIMIT_BYTES,
      1_048_576,
      "BODY_LIMIT_BYTES",
      50_000_000,
    ),
    shutdownTimeoutMs: positiveInteger(
      environment.SHUTDOWN_TIMEOUT_MS,
      10_000,
      "SHUTDOWN_TIMEOUT_MS",
      120_000,
    ),
    openApiEnabled: openApiEnabledValue === "true",
    metricsEnabled,
    metricsToken,
  };
}
