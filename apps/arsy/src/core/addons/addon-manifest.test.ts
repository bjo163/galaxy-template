import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HttpError } from "../auth/identity.js";
import {
  validateAddonConfiguration,
  validateAddonManifest,
} from "./addon-manifest.js";

const validManifest = {
  id: "com.example.contacts",
  version: "1.0.0",
  arsyApi: "^1",
  kind: "declarative",
  scope: "project",
  dependencies: [],
  capabilities: ["records.read"],
  permissions: [],
  configSchema: {
    type: "object",
    additionalProperties: false,
    required: ["pageSize"],
    properties: {
      pageSize: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 25,
      },
      label: {
        type: "string",
        minLength: 1,
        maxLength: 30,
        default: "Contacts",
      },
    },
  },
};

describe("add-on manifest validation", () => {
  it("normalizes the manifest and applies defaults", () => {
    const manifest = validateAddonManifest(validManifest);

    assert.equal(manifest.id, "com.example.contacts");
    assert.deepEqual(validateAddonConfiguration(manifest, {}), {
      pageSize: 25,
      label: "Contacts",
    });
  });

  it("rejects executable content, duplicate UI IDs, and invalid config bounds", () => {
    const manifest = validateAddonManifest(validManifest);

    assert.throws(
      () => validateAddonManifest({ ...validManifest, script: "run()" }),
      HttpError,
    );
    assert.throws(
      () =>
        validateAddonManifest({
          ...validManifest,
          ui: [
            { id: "home", title: "Home", modelKey: "contacts", fields: ["name"] },
            { id: "home", title: "Other", modelKey: "contacts", fields: ["name"] },
          ],
        }),
      HttpError,
    );
    assert.throws(
      () =>
        validateAddonManifest({
          ...validManifest,
          configSchema: {
            ...validManifest.configSchema,
            properties: {
              pageSize: {
                type: "integer",
                minimum: 10,
                maximum: 20,
                default: 5,
              },
            },
          },
        }),
      HttpError,
    );
    assert.throws(
      () => validateAddonConfiguration(manifest, { pageSize: null }),
      HttpError,
    );
  });
});
