import { STATUS_CODES } from "node:http";

import type { FastifyRequest } from "fastify";

export type ProblemDetails = {
  type: "about:blank";
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId: string;
};

const problemTitles: Readonly<Record<number, string>> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Content Too Large",
  415: "Unsupported Media Type",
  422: "Unprocessable Content",
  429: "Too Many Requests",
};

export const problemDetailsSchema = {
  type: "object",
  properties: {
    type: { type: "string", const: "about:blank" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
    instance: { type: "string" },
    requestId: { type: "string" },
  },
  required: ["type", "title", "status", "detail", "instance", "requestId"],
  additionalProperties: false,
} as const;

export function createProblemDetails(
  request: FastifyRequest,
  status: number,
  detail: string,
): ProblemDetails {
  const instance = new URL(request.url, "http://localhost").pathname;

  return {
    type: "about:blank",
    title:
      problemTitles[status] ?? STATUS_CODES[status] ?? "Internal Server Error",
    status,
    detail,
    instance,
    requestId: request.id,
  };
}
