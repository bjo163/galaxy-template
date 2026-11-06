import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HttpError } from "../auth/identity.js";
import {
  modelDefinitionHash,
  validateModelDefinition,
  validateRecordPayload,
} from "./model-definition.js";

const validDefinition = {
  key: "contacts",
  displayName: "Contacts",
  fields: [
    {
      key: "name",
      type: "string",
      required: true,
      maxLength: 80,
      indexed: true,
      unique: true,
    },
    {
      key: "score",
      type: "integer",
      required: false,
      minimum: 0,
      maximum: 100,
      default: 10,
    },
  ],
  access: { defaultVisibility: "private" },
};

describe("model definition validation", () => {
  it("normalizes valid definitions and hashes them deterministically", () => {
    const definition = validateModelDefinition(validDefinition);

    assert.equal(definition.key, "contacts");
    assert.equal(definition.displayName, "Contacts");
    assert.equal(definition.fields.length, 2);
    assert.equal(
      modelDefinitionHash(definition),
      modelDefinitionHash(validateModelDefinition(validDefinition)),
    );
  });

  it("rejects reserved keys, unknown properties, duplicate fields, and bad bounds", () => {
    for (const invalid of [
      { ...validDefinition, key: "created_at" },
      {
        ...validDefinition,
        unexpected: true,
      },
      {
        ...validDefinition,
        fields: [validDefinition.fields[0], validDefinition.fields[0]],
      },
      {
        ...validDefinition,
        fields: [
          {
            key: "score",
            type: "integer",
            minimum: 12,
            maximum: 2,
          },
        ],
      },
    ]) {
      assert.throws(() => validateModelDefinition(invalid), HttpError);
    }
  });

  it("validates record requirements, ranges, and unknown fields", () => {
    const definition = validateModelDefinition(validDefinition);

    assert.deepEqual(validateRecordPayload(definition, { name: "Ada" }), {
      name: "Ada",
      score: 10,
    });
    assert.throws(
      () => validateRecordPayload(definition, { score: 10 }),
      /Field "name" is required/,
    );
    assert.throws(
      () => validateRecordPayload(definition, { name: "Ada", score: 101 }),
      /outside its range/,
    );
    assert.throws(
      () => validateRecordPayload(definition, { name: null }),
      /Field "name" is required/,
    );
    assert.throws(
      () =>
        validateRecordPayload(definition, {
          name: "Ada",
          owner_user_id: "attacker-controlled",
        }),
      /unknown field/,
    );
  });

  it("rejects defaults that violate required, range, length, or enum constraints", () => {
    for (const field of [
      { key: "name", type: "string", required: true, default: null },
      { key: "score", type: "integer", maximum: 10, default: 11 },
      { key: "name", type: "string", maxLength: 3, default: "long" },
      { key: "score", type: "integer", enum: [1, 2], default: 3 },
    ]) {
      assert.throws(
        () =>
          validateModelDefinition({
            ...validDefinition,
            fields: [field],
          }),
        HttpError,
      );
    }
  });

  it("rejects record payloads that exceed structural and byte budgets", () => {
    const definition = validateModelDefinition({
      key: "documents",
      displayName: "Documents",
      fields: [{ key: "content", type: "json", required: true }],
      access: { defaultVisibility: "project" },
    });

    const tooDeep: Record<string, unknown> = {};
    let cursor = tooDeep;
    for (let index = 0; index < 18; index += 1) {
      const child: Record<string, unknown> = {};
      cursor.child = child;
      cursor = child;
    }
    assert.throws(
      () => validateRecordPayload(definition, { content: tooDeep }),
      /complexity limits/,
    );
    assert.throws(
      () => validateRecordPayload(definition, { content: "x".repeat(70_000) }),
      /string exceeds the size limit/,
    );
    assert.throws(
      () => validateRecordPayload(definition, { content: "x".repeat(270_000) }),
      /string exceeds the size limit/,
    );
  });

  it("merges partial updates before checking required fields", () => {
    const definition = validateModelDefinition(validDefinition);

    assert.deepEqual(
      validateRecordPayload(
        definition,
        { score: 20 },
        { name: "Ada", score: 10 },
      ),
      { name: "Ada", score: 20 },
    );
  });
});
