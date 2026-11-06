import type { FastifyInstance } from "fastify";

import { createProblemDetails } from "../core/http/problem-details.js";
import { EmailDeliveryUnavailableError } from "../core/email/email-delivery.js";
import {
  SharedQuotaBackendUnavailableError,
  SharedQuotaExceededError,
} from "../core/rate-limiting/shared-quota.js";

export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    return reply
      .code(404)
      .type("application/problem+json")
      .send(
        createProblemDetails(
          request,
          404,
          "The requested resource was not found.",
        ),
      );
  });

  app.setErrorHandler((error, request, reply) => {
    const errorStatusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    const statusCode =
      error instanceof SharedQuotaBackendUnavailableError ||
      error instanceof EmailDeliveryUnavailableError
        ? 503
        : errorStatusCode >= 400 && errorStatusCode < 500
          ? errorStatusCode
          : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "request failed");
    } else {
      request.log.warn({ err: error }, "request rejected");
    }

    const detail =
      statusCode === 500
        ? "An unexpected error occurred."
        : error instanceof EmailDeliveryUnavailableError
          ? error.message
        : error instanceof SharedQuotaBackendUnavailableError
          ? "The shared request quota backend is unavailable."
          : statusCode === 429
            ? "The request rate limit was exceeded."
            : error instanceof Error
              ? error.message
              : "The request could not be processed.";

    if (error instanceof SharedQuotaExceededError) {
      reply
        .header("retry-after", String(error.quota.retryAfterSeconds))
        .header("ratelimit-limit", String(error.quota.limit))
        .header("ratelimit-remaining", "0")
        .header("ratelimit-reset", String(error.quota.resetAtEpochSeconds));
    }

    return reply
      .code(statusCode)
      .type("application/problem+json")
      .send(createProblemDetails(request, statusCode, detail));
  });
}
