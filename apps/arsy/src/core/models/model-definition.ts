import { createHash } from "node:crypto";

import { HttpError } from "../auth/identity.js";

export const modelFieldTypes = [
  "string",
  "integer",
  "number",
  "boolean",
  "date",
  "datetime",
  "uuid",
  "json",
] as const;

export type ModelFieldType = (typeof modelFieldTypes)[number];

export type ModelField = {
  key: string;
  type: ModelFieldType;
  required: boolean;
  indexed: boolean;
  unique: boolean;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: Array<string | number | boolean>;
  default?: string | number | boolean | null;
};

export type ModelDefinition = {
  key: string;
  displayName: string;
  fields: ModelField[];
  access: {
    defaultVisibility: "private" | "project";
  };
};

const fieldKeyPattern = /^[a-z][a-z0-9_]{0,62}$/;
const modelKeyPattern = /^[a-z][a-z0-9_]{0,62}$/;
const reservedKeys = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "owner_user_id",
  "workspace_id",
  "project_id",
  "model_key",
  "model_revision",
]);
const fieldProperties = new Set([
  "key",
  "type",
  "required",
  "indexed",
  "unique",
  "maxLength",
  "minimum",
  "maximum",
  "enum",
  "default",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateField(value: unknown): ModelField {
  if (!isObject(value)) {
    throw new HttpError(400, "Each model field must be an object.");
  }
  if (Object.keys(value).some((key) => !fieldProperties.has(key))) {
    throw new HttpError(400, "A model field contains an unsupported property.");
  }

  const { key, type } = value;
  if (
    typeof key !== "string" ||
    !fieldKeyPattern.test(key) ||
    reservedKeys.has(key)
  ) {
    throw new HttpError(400, "A model field key is invalid or reserved.");
  }
  if (
    typeof type !== "string" ||
    !modelFieldTypes.includes(type as ModelFieldType)
  ) {
    throw new HttpError(400, `The type for field "${key}" is unsupported.`);
  }

  const required = value.required ?? false;
  const indexed = value.indexed ?? false;
  const unique = value.unique ?? false;
  if (
    typeof required !== "boolean" ||
    typeof indexed !== "boolean" ||
    typeof unique !== "boolean"
  ) {
    throw new HttpError(400, `Field "${key}" has an invalid boolean option.`);
  }
  if (unique && !indexed) {
    throw new HttpError(400, `Unique field "${key}" must also be indexed.`);
  }

  const field: ModelField = {
    key,
    type: type as ModelFieldType,
    required,
    indexed,
    unique,
  };

  if (value.maxLength !== undefined) {
    if (
      type !== "string" ||
      typeof value.maxLength !== "number" ||
      !Number.isInteger(value.maxLength) ||
      value.maxLength < 1 ||
      value.maxLength > 10_000
    ) {
      throw new HttpError(400, `Field "${key}" has an invalid maxLength.`);
    }
    field.maxLength = value.maxLength;
  }

  for (const bound of ["minimum", "maximum"] as const) {
    const boundValue = value[bound];
    if (boundValue !== undefined) {
      if (
        (type !== "integer" && type !== "number") ||
        typeof boundValue !== "number" ||
        !Number.isFinite(boundValue)
      ) {
        throw new HttpError(400, `Field "${key}" has an invalid ${bound}.`);
      }
      field[bound] = boundValue;
    }
  }
  if (
    field.minimum !== undefined &&
    field.maximum !== undefined &&
    field.minimum > field.maximum
  ) {
    throw new HttpError(400, `Field "${key}" has an inverted numeric range.`);
  }

  if (value.enum !== undefined) {
    if (
      !Array.isArray(value.enum) ||
      value.enum.length === 0 ||
      value.enum.length > 100 ||
      value.enum.some((item) => !isValidFieldValue(field.type, item)) ||
      new Set(value.enum.map((item) => JSON.stringify(item))).size !==
        value.enum.length
    ) {
      throw new HttpError(400, `Field "${key}" has an invalid enum.`);
    }
    field.enum = value.enum as Array<string | number | boolean>;
  }

  if (value.default !== undefined) {
    if (!isValidFieldValue(field.type, value.default)) {
      throw new HttpError(400, `Field "${key}" has an invalid default.`);
    }
    field.default = value.default as ModelField["default"];
    if (
      (field.required && field.default === null) ||
      (typeof field.default === "string" &&
        field.maxLength !== undefined &&
        field.default.length > field.maxLength) ||
      (typeof field.default === "number" &&
        ((field.minimum !== undefined && field.default < field.minimum) ||
          (field.maximum !== undefined && field.default > field.maximum))) ||
      (field.enum !== undefined &&
        !field.enum.some((item) => item === field.default))
    ) {
      throw new HttpError(400, `Field "${key}" has an invalid default.`);
    }
  }

  return field;
}

export function validateModelDefinition(value: unknown): ModelDefinition {
  if (!isObject(value)) {
    throw new HttpError(400, "A model definition must be an object.");
  }
  const allowedProperties = new Set(["key", "displayName", "fields", "access"]);
  if (Object.keys(value).some((key) => !allowedProperties.has(key))) {
    throw new HttpError(400, "The model definition contains an unsupported property.");
  }

  if (
    typeof value.key !== "string" ||
    !modelKeyPattern.test(value.key) ||
    reservedKeys.has(value.key)
  ) {
    throw new HttpError(400, "The model key is invalid or reserved.");
  }
  if (
    typeof value.displayName !== "string" ||
    !value.displayName.trim() ||
    value.displayName.length > 120
  ) {
    throw new HttpError(400, "The model display name is invalid.");
  }
  if (
    !Array.isArray(value.fields) ||
    value.fields.length === 0 ||
    value.fields.length > 50
  ) {
    throw new HttpError(400, "A model must define between 1 and 50 fields.");
  }
  if (!isObject(value.access)) {
    throw new HttpError(400, "The model access policy is required.");
  }
  if (
    Object.keys(value.access).some((key) => key !== "defaultVisibility") ||
    (value.access.defaultVisibility !== "private" &&
      value.access.defaultVisibility !== "project")
  ) {
    throw new HttpError(400, "The model access policy is invalid.");
  }

  const fields = value.fields.map(validateField);
  if (new Set(fields.map((field) => field.key)).size !== fields.length) {
    throw new HttpError(400, "Model field keys must be unique.");
  }
  const definition: ModelDefinition = {
    key: value.key,
    displayName: value.displayName.trim(),
    fields,
    access: {
      defaultVisibility: value.access.defaultVisibility,
    },
  };
  if (Buffer.byteLength(canonicalJson(definition), "utf8") > 32_768) {
    throw new HttpError(400, "The model definition exceeds the 32 KB limit.");
  }
  return definition;
}

function isValidFieldValue(type: ModelFieldType, value: unknown): boolean {
  if (value === null) {
    return true;
  }

  switch (type) {
    case "string":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isSafeInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
      );
    case "datetime":
      return (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(value) &&
        !Number.isNaN(Date.parse(value))
      );
    case "uuid":
      return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value,
        )
      );
    case "json":
      return value !== undefined;
  }
}

export function validateRecordPayload(
  definition: ModelDefinition,
  input: unknown,
  previous?: Record<string, unknown>,
): Record<string, unknown> {
  if (!isObject(input)) {
    throw new HttpError(400, "A record payload must be a JSON object.");
  }

  const values = { ...(previous ?? {}), ...input };
  const allowed = new Set(definition.fields.map((field) => field.key));
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new HttpError(400, "The record payload contains an unknown field.");
  }

  const normalized: Record<string, unknown> = {};
  for (const field of definition.fields) {
    let value = values[field.key];
    if (value === undefined && field.default !== undefined) {
      value = field.default;
    }
    if (value === undefined) {
      if (field.required) {
        throw new HttpError(400, `Field "${field.key}" is required.`);
      }
      continue;
    }
    if (value === null && field.required) {
      throw new HttpError(400, `Field "${field.key}" is required.`);
    }
    if (!isValidFieldValue(field.type, value)) {
      throw new HttpError(400, `Field "${field.key}" has an invalid value.`);
    }
    if (
      field.type === "string" &&
      typeof value === "string" &&
      field.maxLength !== undefined &&
      value.length > field.maxLength
    ) {
      throw new HttpError(400, `Field "${field.key}" exceeds maxLength.`);
    }
    if (typeof value === "number") {
      if (
        (field.minimum !== undefined && value < field.minimum) ||
        (field.maximum !== undefined && value > field.maximum)
      ) {
        throw new HttpError(400, `Field "${field.key}" is outside its range.`);
      }
    }
    if (field.enum && !field.enum.some((item) => item === value)) {
      throw new HttpError(400, `Field "${field.key}" is not an allowed value.`);
    }
    normalized[field.key] = value;
  }

  return normalized;
}

function canonicalValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalValue).join(",")}]`;
  }
  if (isObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalValue(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalJson(value: unknown): string {
  return canonicalValue(value);
}

export function modelDefinitionHash(definition: ModelDefinition): string {
  return createHash("sha256").update(canonicalJson(definition)).digest("hex");
}

export function validateDefinitionRevision(value: unknown): ModelDefinition {
  return validateModelDefinition(value);
}
