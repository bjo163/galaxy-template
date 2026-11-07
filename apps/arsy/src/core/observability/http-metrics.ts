import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "@prometheus-io/client";
import type { FastifyReply, FastifyRequest } from "fastify";

const knownMethods = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

export class HttpMetrics {
  readonly registry: Registry;
  private readonly requests: Counter<"method" | "route" | "status_code">;
  private readonly duration: Histogram<"method" | "route" | "status_code">;
  private readonly databasePool: Gauge<"state">;
  private readonly databaseQueryCount: Counter<"operation">;
  private readonly databaseQueryDuration: Histogram<"operation">;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ service: "arsy" });
    collectDefaultMetrics({
      register: this.registry,
      prefix: "arsy_",
    });

    this.requests = new Counter({
      name: "arsy_http_requests_total",
      help: "Total number of completed HTTP requests.",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });

    this.duration = new Histogram({
      name: "arsy_http_request_duration_seconds",
      help: "HTTP request duration in seconds.",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.databasePool = new Gauge({
      name: "arsy_database_pool_connections",
      help: "Current Knex database pool connections by state.",
      labelNames: ["state"],
      registers: [this.registry],
    });
    this.databaseQueryCount = new Counter({
      name: "arsy_database_queries_total",
      help: "Total completed database queries by SQL operation.",
      labelNames: ["operation"],
      registers: [this.registry],
    });
    this.databaseQueryDuration = new Histogram({
      name: "arsy_database_query_duration_seconds",
      help: "Database query duration in seconds by SQL operation.",
      labelNames: ["operation"],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }

  recordDatabasePool(knex: unknown): void {
    const pool = (knex as { client?: { pool?: {
      numUsed?: () => number;
      numFree?: () => number;
      numPendingAcquires?: () => number;
      numPendingCreates?: () => number;
    } } } | null)?.client?.pool;
    if (!pool) return;
    this.databasePool.set({ state: "used" }, pool.numUsed?.() ?? 0);
    this.databasePool.set({ state: "free" }, pool.numFree?.() ?? 0);
    this.databasePool.set({ state: "pending_acquires" }, pool.numPendingAcquires?.() ?? 0);
    this.databasePool.set({ state: "pending_creates" }, pool.numPendingCreates?.() ?? 0);
  }

  recordDatabaseQuery(operation: string, durationSeconds: number): void {
    const knownOperations = new Set(["SELECT", "INSERT", "UPDATE", "DELETE"]);
    const label = knownOperations.has(operation) ? operation : "OTHER";
    this.databaseQueryCount.inc({ operation: label });
    this.databaseQueryDuration.observe({ operation: label }, durationSeconds);
  }

  recordRequest(request: FastifyRequest, reply: FastifyReply): void {
    const labels = {
      method: knownMethods.has(request.method) ? request.method : "OTHER",
      route: request.routeOptions.url ?? "unmatched",
      status_code: String(reply.statusCode),
    };

    this.requests.inc(labels);
    this.duration.observe(labels, reply.elapsedTime / 1000);
  }
}
