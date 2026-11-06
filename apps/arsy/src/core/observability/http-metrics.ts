import {
  collectDefaultMetrics,
  Counter,
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
