import type { FastifyInstance } from "fastify";

import { HttpError } from "../core/auth/identity.js";
import { createProblemDetails } from "../core/http/problem-details.js";

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
      errorStatusCode >= 400 && errorStatusCode < 500 ? errorStatusCode : 500;

    if (statusCode === 500) {
      request.log.error({ err: error }, "request failed");
    } else {
      request.log.warn({ err: error }, "request rejected");
    }

    const detail =
      statusCode === 500
        ? "An unexpected error occurred."
        : statusCode === 429
          ? "The request rate limit was exceeded."
          : error instanceof Error
            ? error.message
            : "The request could not be processed.";

    if (error instanceof HttpError) {
      for (const [name, value] of Object.entries(error.headers)) {
        reply.header(name, value);
      }
    }

    return reply
      .code(statusCode)
      .type("application/problem+json")
      .send(createProblemDetails(request, statusCode, detail));
  });
}
