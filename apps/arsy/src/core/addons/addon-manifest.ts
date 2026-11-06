import { createHash } from "node:crypto";

import { HttpError } from "../auth/identity.js";
import { canonicalJson } from "../models/model-definition.js";

const supportedCapabilities = new Set([
  "models.read",
  "records.read",
]);
const addonIdPattern =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const modelKeyPattern = /^[a-z][a-z0-9_]{0,62}$/;
const configTypes = new Set(["string", "integer", "number", "boolean"]);

export type AddonConfigProperty = {
  type: "string" | "integer" | "number" | "boolean";
  title?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: Array<string | number | boolean>;
  default?: string | number | boolean;
};

export type AddonManifest = {
  id: string;
  version: string;
  arsyApi: "^1";
  kind: "declarative";
  scope: "project";
  dependencies: Array<{ id: string; version: string }>;
  capabilities: string[];
  permissions: string[];
  configSchema: {
    type: "object";
    additionalProperties: false;
    required: string[];
    properties: Record<string, AddonConfigProperty>;
  };
  ui?: Array<{
    id: string;
    title: string;
    modelKey: string;
    fields: string[];
  }>;
};

export const addonManifestBodySchema = {
  type: "object",
  additionalProperties: true,
  required: [
    "id",
    "version",
    "arsyApi",
    "kind",
    "scope",
    "dependencies",
    "capabilities",
    "permissions",
    "configSchema",
  ],
  properties: {
    id: { type: "string", pattern: addonIdPattern.source, maxLength: 160 },
    version: { type: "string", maxLength: 32 },
    arsyApi: { type: "string", const: "^1" },
    kind: { type: "string", const: "declarative" },
    scope: { type: "string", const: "project" },
    dependencies: { type: "array", maxItems: 10, items: { type: "object" } },
    capabilities: {
      type: "array",
      maxItems: supportedCapabilities.size,
      uniqueItems: true,
      items: { type: "string", enum: [...supportedCapabilities] },
    },
    permissions: { type: "array", maxItems: 50, items: { type: "string" } },
    configSchema: { type: "object" },
    ui: { type: "array", maxItems: 20, items: { type: "object" } },
  },
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  context: string,
): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new HttpError(400, `${context} contains an unsupported property.`);
  }
}

function validateConfigProperty(
  key: string,
  value: unknown,
): AddonConfigProperty {
  if (!isObject(value)) {
    throw new HttpError(400, `Configuration property "${key}" is invalid.`);
  }
  rejectUnknownKeys(
    value,
    [
      "type",
      "title",
      "minLength",
      "maxLength",
      "minimum",
      "maximum",
      "enum",
      "default",
    ],
    `Configuration property "${key}"`,
  );
  if (
    typeof value.type !== "string" ||
    !configTypes.has(value.type)
  ) {
    throw new HttpError(400, `Configuration property "${key}" has an invalid type.`);
  }

  const property: AddonConfigProperty = {
    type: value.type as AddonConfigProperty["type"],
  };
  if (value.title !== undefined) {
    if (typeof value.title !== "string" || value.title.length > 120) {
      throw new HttpError(400, `Configuration property "${key}" has an invalid title.`);
    }
    property.title = value.title;
  }

  for (const bound of ["minLength", "maxLength"] as const) {
    if (value[bound] !== undefined) {
      if (
        property.type !== "string" ||
        typeof value[bound] !== "number" ||
        !Number.isInteger(value[bound]) ||
        value[bound] < (bound === "minLength" ? 0 : 1) ||
        value[bound] > 10_000
      ) {
        throw new HttpError(400, `Configuration property "${key}" has invalid length limits.`);
      }
      property[bound] = value[bound];
    }
  }
  for (const bound of ["minimum", "maximum"] as const) {
    if (value[bound] !== undefined) {
      if (
        (property.type !== "integer" && property.type !== "number") ||
        typeof value[bound] !== "number" ||
        !Number.isFinite(value[bound])
      ) {
        throw new HttpError(400, `Configuration property "${key}" has invalid numeric limits.`);
      }
      property[bound] = value[bound];
    }
  }
  if (
    property.minimum !== undefined &&
    property.maximum !== undefined &&
    property.minimum > property.maximum
  ) {
    throw new HttpError(400, `Configuration property "${key}" has inverted numeric limits.`);
  }

  const isWithinBounds = (item: string | number | boolean): boolean =>
    (typeof item !== "string" ||
      ((property.minLength === undefined || item.length >= property.minLength) &&
        (property.maxLength === undefined || item.length <= property.maxLength))) &&
    (typeof item !== "number" ||
      ((property.minimum === undefined || item >= property.minimum) &&
        (property.maximum === undefined || item <= property.maximum)));

  if (value.enum !== undefined) {
    if (
      !Array.isArray(value.enum) ||
      value.enum.length === 0 ||
      value.enum.length > 100 ||
      value.enum.some(
        (item) =>
          !validConfigValue(property.type, item) || !isWithinBounds(item),
      )
    ) {
      throw new HttpError(400, `Configuration property "${key}" has an invalid enum.`);
    }
    property.enum = value.enum as Array<string | number | boolean>;
  }
  if (
    value.default !== undefined &&
    (!validConfigValue(property.type, value.default) ||
      !isWithinBounds(value.default as string | number | boolean) ||
      (property.enum !== undefined &&
        !property.enum.some((allowedValue) => allowedValue === value.default)))
  ) {
    throw new HttpError(400, `Configuration property "${key}" has an invalid default.`);
  }
  if (value.default !== undefined) {
    property.default = value.default as AddonConfigProperty["default"];
  }

  return property;
}

function validConfigValue(
  type: AddonConfigProperty["type"],
  value: unknown,
): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isSafeInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
  }
}

export function validateAddonManifest(value: unknown): AddonManifest {
  if (!isObject(value)) {
    throw new HttpError(400, "An add-on manifest must be an object.");
  }
  rejectUnknownKeys(
    value,
    [
      "id",
      "version",
      "arsyApi",
      "kind",
      "scope",
      "dependencies",
      "capabilities",
      "permissions",
      "configSchema",
      "ui",
    ],
    "The add-on manifest",
  );
  if (
    typeof value.id !== "string" ||
    !addonIdPattern.test(value.id) ||
    value.id.length > 160
  ) {
    throw new HttpError(400, "The add-on ID must use a reverse-domain identifier.");
  }
  if (
    typeof value.version !== "string" ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(
      value.version,
    )
  ) {
    throw new HttpError(400, "The add-on version must use semantic versioning.");
  }
  if (value.arsyApi !== "^1" || value.kind !== "declarative" || value.scope !== "project") {
    throw new HttpError(400, "The add-on kind, scope, or Arsy API version is unsupported.");
  }
  if (!Array.isArray(value.dependencies) || value.dependencies.length > 10) {
    throw new HttpError(400, "An add-on may declare at most 10 dependencies.");
  }
  const dependencies = value.dependencies.map((dependency) => {
    if (!isObject(dependency)) {
      throw new HttpError(400, "An add-on dependency is invalid.");
    }
    rejectUnknownKeys(dependency, ["id", "version"], "An add-on dependency");
    if (
      typeof dependency.id !== "string" ||
      !addonIdPattern.test(dependency.id) ||
      typeof dependency.version !== "string" ||
      !/^\d+\.\d+\.\d+$/.test(dependency.version)
    ) {
      throw new HttpError(400, "An add-on dependency has an invalid ID or version.");
    }
    if (dependency.id === value.id) {
      throw new HttpError(400, "An add-on cannot depend on itself.");
    }
    return { id: dependency.id, version: dependency.version };
  });
  if (new Set(dependencies.map((dependency) => dependency.id)).size !== dependencies.length) {
    throw new HttpError(400, "Add-on dependency IDs must be unique.");
  }

  if (
    !Array.isArray(value.capabilities) ||
    value.capabilities.length > supportedCapabilities.size ||
    value.capabilities.some(
      (capability) =>
        typeof capability !== "string" ||
        !supportedCapabilities.has(capability),
    ) ||
    new Set(value.capabilities).size !== value.capabilities.length
  ) {
    throw new HttpError(400, "The add-on requests an unsupported capability.");
  }
  if (
    !Array.isArray(value.permissions) ||
    value.permissions.length > 50 ||
    value.permissions.some(
      (permission) =>
        typeof permission !== "string" ||
        !/^[a-z][a-z0-9_.:-]{0,119}$/.test(permission),
    ) ||
    new Set(value.permissions).size !== value.permissions.length
  ) {
    throw new HttpError(400, "The add-on permission list is invalid.");
  }

  if (!isObject(value.configSchema)) {
    throw new HttpError(400, "The add-on configSchema is required.");
  }
  rejectUnknownKeys(
    value.configSchema,
    ["type", "additionalProperties", "required", "properties"],
    "The add-on configSchema",
  );
  if (
    value.configSchema.type !== "object" ||
    value.configSchema.additionalProperties !== false ||
    !Array.isArray(value.configSchema.required) ||
    value.configSchema.required.length > 50 ||
    !isObject(value.configSchema.properties) ||
    Object.keys(value.configSchema.properties).length > 50
  ) {
    throw new HttpError(400, "The add-on configSchema must be a bounded object schema.");
  }
  const properties: Record<string, AddonConfigProperty> = {};
  for (const [key, property] of Object.entries(value.configSchema.properties)) {
    if (!/^[a-z][a-zA-Z0-9_]{0,62}$/.test(key)) {
      throw new HttpError(400, "An add-on configuration key is invalid.");
    }
    properties[key] = validateConfigProperty(key, property);
  }
  const required = value.configSchema.required;
  if (
    required.some(
      (key) => typeof key !== "string" || !Object.hasOwn(properties, key),
    ) ||
    new Set(required).size !== required.length
  ) {
    throw new HttpError(400, "The add-on required configuration keys are invalid.");
  }

  let ui: AddonManifest["ui"];
  if (value.ui !== undefined) {
    if (!Array.isArray(value.ui) || value.ui.length > 20) {
      throw new HttpError(400, "An add-on may define at most 20 UI pages.");
    }
    ui = value.ui.map((page) => {
      if (!isObject(page)) {
        throw new HttpError(400, "An add-on UI page is invalid.");
      }
      rejectUnknownKeys(page, ["id", "title", "modelKey", "fields"], "An add-on UI page");
      if (
        typeof page.id !== "string" ||
        !/^[a-z][a-z0-9-]{0,62}$/.test(page.id) ||
        typeof page.title !== "string" ||
        !page.title.trim() ||
        page.title.length > 120 ||
        typeof page.modelKey !== "string" ||
        !modelKeyPattern.test(page.modelKey) ||
        !Array.isArray(page.fields) ||
        page.fields.length === 0 ||
        page.fields.length > 30 ||
        page.fields.some(
          (field) =>
            typeof field !== "string" ||
            !/^[a-z][a-z0-9_]{0,62}$/.test(field),
        ) ||
        new Set(page.fields).size !== page.fields.length
      ) {
        throw new HttpError(400, "An add-on UI page has invalid metadata.");
      }
      return {
        id: page.id,
        title: page.title.trim(),
        modelKey: page.modelKey,
        fields: page.fields as string[],
      };
    });
    if (new Set(ui.map((page) => page.id)).size !== ui.length) {
      throw new HttpError(400, "Add-on UI page IDs must be unique.");
    }
  }

  const manifest: AddonManifest = {
    id: value.id,
    version: value.version,
    arsyApi: "^1",
    kind: "declarative",
    scope: "project",
    dependencies,
    capabilities: value.capabilities as string[],
    permissions: value.permissions as string[],
    configSchema: {
      type: "object",
      additionalProperties: false,
      required: required as string[],
      properties,
    },
    ...(ui ? { ui } : {}),
  };
  if (Buffer.byteLength(canonicalJson(manifest), "utf8") > 32_768) {
    throw new HttpError(400, "The add-on manifest exceeds the 32 KB limit.");
  }
  return manifest;
}

export function validateAddonConfiguration(
  manifest: AddonManifest,
  value: unknown,
): Record<string, unknown> {
  if (!isObject(value)) {
    throw new HttpError(400, "Add-on configuration must be an object.");
  }
  const allowed = new Set(Object.keys(manifest.configSchema.properties));
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new HttpError(400, "Add-on configuration contains an unsupported property.");
  }

  const configuration: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(manifest.configSchema.properties)) {
    const configValue = Object.hasOwn(value, key) ? value[key] : property.default;
    if (configValue === undefined) {
      if (manifest.configSchema.required.includes(key)) {
        throw new HttpError(400, `Add-on configuration field "${key}" is required.`);
      }
      continue;
    }
    if (
      !validConfigValue(property.type, configValue) ||
      (property.enum &&
        !property.enum.some((allowedValue) => allowedValue === configValue)) ||
      (typeof configValue === "string" &&
        ((property.minLength !== undefined &&
          configValue.length < property.minLength) ||
          (property.maxLength !== undefined &&
            configValue.length > property.maxLength))) ||
      (typeof configValue === "number" &&
        ((property.minimum !== undefined &&
          configValue < property.minimum) ||
          (property.maximum !== undefined &&
            configValue > property.maximum)))
    ) {
      throw new HttpError(400, `Add-on configuration field "${key}" is invalid.`);
    }
    configuration[key] = configValue;
  }
  return configuration;
}

export function addonManifestHash(manifest: AddonManifest): string {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}

export function decodeAddonManifest(value: unknown): AddonManifest {
  return validateAddonManifest(
    typeof value === "string" ? JSON.parse(value) as unknown : value,
  );
}
