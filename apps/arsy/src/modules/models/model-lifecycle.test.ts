import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateModelDefinition, validateRecordPayload } from "../../core/models/model-definition.js";
import {
  applyModelMigrationPlan,
  makeModelIndexName,
} from "./model-lifecycle.js";

describe("model lifecycle primitives", () => {
  it("applies only declarative rename, default, and remove operations", () => {
    const result = applyModelMigrationPlan(
      { old_name: "Ada", obsolete: true },
      {
        operations: [
          { op: "rename", field: "old_name", to: "display_name" },
          { op: "set_default", field: "enabled", value: true },
          { op: "remove", field: "obsolete" },
        ],
      },
    );
    assert.deepEqual(result, { display_name: "Ada", enabled: true });
  });

  it("rejects invalid transforms and validates the final target payload", () => {
    assert.throws(
      () => applyModelMigrationPlan({ name: "Ada" }, { operations: [{ op: "execute", field: "name" }] }),
      /Unsupported migration operation/,
    );

    const target = validateModelDefinition({
      key: "contacts",
      displayName: "Contacts",
      fields: [
        { key: "display_name", type: "string", required: true, indexed: false, unique: false },
      ],
      access: { defaultVisibility: "project" },
    });
    const migrated = applyModelMigrationPlan(
      { old_name: "Ada" },
      { operations: [{ op: "rename", field: "old_name", to: "display_name" }] },
    );
    assert.deepEqual(validateRecordPayload(target, migrated), { display_name: "Ada" });
    assert.throws(() => validateRecordPayload(target, {}), /required/);
  });

  it("creates deterministic and type-sensitive online index names", () => {
    const first = makeModelIndexName("project", "contacts", "email", "string", false);
    assert.equal(first, makeModelIndexName("project", "contacts", "email", "string", false));
    assert.notEqual(first, makeModelIndexName("project", "contacts", "email", "uuid", false));
    assert.notEqual(first, makeModelIndexName("project", "contacts", "email", "string", true));
    assert.match(first, /^arsy_mi_[a-f0-9]{20}$/);
  });
});
