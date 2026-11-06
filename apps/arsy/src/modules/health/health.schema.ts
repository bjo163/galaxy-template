export const healthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "ok" },
  },
  required: ["status"],
  additionalProperties: false,
} as const;

export const unavailableHealthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "unavailable" },
  },
  required: ["status"],
  additionalProperties: false,
} as const;

export const apiHealthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", const: "ok" },
    service: { type: "string", const: "arsy" },
  },
  required: ["status", "service"],
  additionalProperties: false,
} as const;
