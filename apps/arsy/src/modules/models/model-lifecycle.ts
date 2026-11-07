import { createHash } from "node:crypto";

import type { Knex } from "@galaxy/database";
import { validateModelDefinition, validateRecordPayload, type ModelDefinition } from "../../core/models/model-definition.js";

type MigrationJob = {
  id: string;
  workspace_id: string;
  project_id: string;
  definition_id: string;
  to_revision: number;
  status: string;
  plan: Record<string, unknown> | string;
  last_record_id: string | null;
  total_records: string | number;
  processed_records: string | number;
};

type IndexJob = {
  id: string;
  definition_id: string;
  revision: number;
  field_key: string;
  field_type: string;
  index_name: string;
  operation: "create" | "drop";
  model_key: string;
  is_unique: boolean;
  status: string;
  attempts: number;
};

const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 5;

function jsonObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Lifecycle job payload must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

export function applyModelMigrationPlan(
  input: Record<string, unknown>,
  plan: Record<string, unknown>,
): Record<string, unknown> {
  const output = { ...input };
  const operations = plan.operations;
  if (!Array.isArray(operations) || operations.length > 100) {
    throw new Error("Migration plan must contain at most 100 operations.");
  }
  for (const raw of operations) {
    const operation = jsonObject(raw);
    if (typeof operation.field !== "string" || !/^[a-z][a-z0-9_]{0,62}$/.test(operation.field)) {
      throw new Error("Migration operation contains an invalid field key.");
    }
    if (operation.op === "rename") {
      if (typeof operation.to !== "string" || !/^[a-z][a-z0-9_]{0,62}$/.test(operation.to)) {
        throw new Error("Rename operation contains an invalid destination field.");
      }
      if (Object.hasOwn(output, operation.field)) {
        output[operation.to] = output[operation.field];
        delete output[operation.field];
      }
    } else if (operation.op === "set_default") {
      if (!Object.hasOwn(output, operation.field) && Object.hasOwn(operation, "value")) {
        output[operation.field] = operation.value;
      }
    } else if (operation.op === "cast") {
      const value = output[operation.field];
      if (value === undefined || value === null) continue;
      if (operation.toType === "string") {
        output[operation.field] = String(value);
      } else if (operation.toType === "integer" || operation.toType === "number") {
        const converted = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
        if (!Number.isFinite(converted) || (operation.toType === "integer" && !Number.isSafeInteger(converted))) {
          throw new Error("Field cast produced an invalid numeric value.");
        }
        output[operation.field] = converted;
      } else if (operation.toType === "boolean") {
        if (value === true || value === false) output[operation.field] = value;
        else if (value === "true" || value === "false") output[operation.field] = value === "true";
        else throw new Error("Field cast produced an invalid boolean value.");
      } else if (["date", "datetime", "uuid"].includes(String(operation.toType)) && typeof value === "string") {
        output[operation.field] = value;
      } else {
        throw new Error("Unsupported or unsafe field cast.");
      }
    } else if (operation.op === "remove") {
      delete output[operation.field];
    } else {
      throw new Error("Unsupported migration operation.");
    }
  }
  return output;
}

function fieldSqlExpression(fieldKey: string, fieldType: string): string {
  const key = fieldKey.replace(/'/g, "''");
  const value = `payload ->> '${key}'`;
  switch (fieldType) {
    case "integer":
    case "number":
      return `(${value})::numeric`;
    case "boolean":
      return `(${value})::boolean`;
    case "date":
      return `(${value})::date`;
    case "datetime":
      return `(${value})::timestamptz`;
    case "string":
    case "uuid":
    case "json":
      return value;
    default:
      throw new Error("Unsupported indexed field type.");
  }
}

export function makeModelIndexName(
  projectId: string,
  modelKey: string,
  fieldKey: string,
  fieldType: string,
  unique: boolean,
): string {
  const digest = createHash("sha256")
    .update([projectId, modelKey, fieldKey, fieldType, unique ? "unique" : "plain"].join(":"))
    .digest("hex")
    .slice(0, 20);
  return `arsy_mi_${digest}`;
}

/**
 * Process one resumable transform batch. Every batch commits independently;
 * the cursor and data updates are committed atomically so retries are safe.
 * A transform failure leaves the active model revision untouched.
 */
export async function processModelMigrationBatch(
  knex: Knex,
  jobId: string,
): Promise<"ready" | "running" | "failed" | "missing"> {
  return knex.transaction(async (trx) => {
    const job = await trx("arsy_model_migration_jobs")
      .where({ id: jobId })
      .forUpdate()
      .first() as MigrationJob | undefined;
    if (!job) return "missing";
    if (job.status === "ready") return "ready";
    if (job.status === "failed" || job.status === "cancelled") return job.status as "failed";

    const plan = jsonObject(job.plan);
    const target = validateModelDefinition(plan.targetDefinition) as ModelDefinition;
    if (!Array.isArray(target.fields)) {
      await trx("arsy_model_migration_jobs").where({ id: jobId }).update({
        status: "failed",
        last_error: "The migration plan has no target model definition.",
        updated_at: new Date(),
      });
      return "failed";
    }

    const records = trx("arsy_records")
      .select("id", "payload")
      .where({
        workspace_id: job.workspace_id,
        project_id: job.project_id,
        definition_id: job.definition_id,
      })
      .orderBy("id", "asc")
      .limit(BATCH_SIZE);
    if (job.last_record_id) records.andWhere("id", ">", job.last_record_id);
    const rows = await records;
    if (rows.length === 0) {
      await trx("arsy_model_migration_jobs").where({ id: jobId }).update({
        status: "ready",
        completed_at: new Date(),
        updated_at: new Date(),
        last_error: null,
      });
      return "ready";
    }

    try {
      for (const row of rows) {
        const migrated = validateRecordPayload(target, applyModelMigrationPlan(jsonObject(row.payload), plan));
        // The API's model validator is intentionally not duplicated here.
        // A caller must supply a plan that has passed preview validation.
        await trx("arsy_model_migration_records").insert({
          job_id: job.id,
          workspace_id: job.workspace_id,
          project_id: job.project_id,
          record_id: row.id,
          payload: JSON.stringify(migrated),
          updated_at: new Date(),
        }).onConflict(["job_id", "record_id"]).merge({
          payload: JSON.stringify(migrated),
          updated_at: new Date(),
        });
      }
    } catch (error) {
      await trx("arsy_model_migration_jobs").where({ id: jobId }).update({
        status: "failed",
        failed_records: trx.raw('"failed_records" + 1'),
        last_error: error instanceof Error ? error.message.slice(0, 2_000) : "Unknown transform error",
        updated_at: new Date(),
      });
      return "failed";
    }

    const last = rows.at(-1);
    const nextProcessed = Number(job.processed_records) + rows.length;
    await trx("arsy_model_migration_jobs").where({ id: jobId }).update({
      status: "running",
      last_record_id: last?.id,
      processed_records: nextProcessed,
      started_at: trx.raw("COALESCE(started_at, ?)", [new Date()]),
      updated_at: new Date(),
    });
    return "running";
  });
}

/**
 * PostgreSQL concurrent index DDL must execute outside a transaction.
 * A persisted job is claimed transactionally, DDL runs on the root Knex
 * connection, and validity is checked before the job is marked ready.
 */
export async function processModelIndexJob(
  knex: Knex,
  jobId: string,
): Promise<"ready" | "running" | "failed" | "missing"> {
  const candidate = await knex("arsy_model_index_jobs").where({ id: jobId }).first() as IndexJob | undefined;
  if (candidate?.operation === "drop") {
    const replacementBuild = await knex("arsy_model_index_jobs")
      .select("id")
      .where({
        definition_id: candidate.definition_id,
        revision: candidate.revision,
        field_key: candidate.field_key,
        operation: "create",
      })
      .whereNot("status", "ready")
      .first();
    if (replacementBuild) return "running";
  }
  const job = await knex.transaction(async (trx) => {
    const row = await trx("arsy_model_index_jobs")
      .where({ id: jobId })
      .forUpdate()
      .first() as IndexJob | undefined;
    if (!row) return null;
    if (row.status === "ready" || row.status === "removed") return row;
    if (row.attempts >= MAX_ATTEMPTS) {
      await trx("arsy_model_index_jobs").where({ id: jobId }).update({
        status: "failed",
        last_error: "Maximum online index attempts reached.",
        updated_at: new Date(),
      });
      return { ...row, status: "failed" };
    }
    await trx("arsy_model_index_jobs").where({ id: jobId }).update({
      status: row.operation === "create" ? "building" : "retiring",
      attempts: row.attempts + 1,
      started_at: trx.raw("COALESCE(started_at, ?)", [new Date()]),
      updated_at: new Date(),
      last_error: null,
    });
    return row;
  });

  if (!job) return "missing";
  if (job.status === "ready" || job.status === "removed") return "ready";
  if (job.status === "failed") return "failed";

  try {
    const expression = fieldSqlExpression(job.field_key, job.field_type);
    if (job.operation === "create") {
      await knex.raw(`${job.is_unique ? "CREATE UNIQUE INDEX CONCURRENTLY" : "CREATE INDEX CONCURRENTLY"} IF NOT EXISTS "${job.index_name}" ON "arsy_records" ("workspace_id", "project_id", "model_key", ${expression})`);
      const validity = await knex({ i: "pg_index" })
        .select("i.indisvalid as valid")
        .join({ c: "pg_class" }, "c.oid", "i.indexrelid")
        .where("c.relname", job.index_name)
        .first();
      if (!validity?.valid) throw new Error("PostgreSQL reports the concurrent index as invalid.");
      await knex("arsy_model_index_jobs").where({ id: jobId }).update({
        status: "ready",
        completed_at: new Date(),
        updated_at: new Date(),
        last_error: null,
      });
      return "ready";
    }

    await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS "${job.index_name}"`);
    await knex("arsy_model_index_jobs").where({ id: jobId }).update({
      status: "removed",
      completed_at: new Date(),
      updated_at: new Date(),
      last_error: null,
    });
    return "ready";
  } catch (error) {
    if (job.operation === "create") {
      try {
        await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS "${job.index_name}"`);
      } catch {
        // Preserve the original failure; the next worker attempt can retry cleanup.
      }
    }
    const message = error instanceof Error ? error.message.slice(0, 2_000) : "Unknown online index error";
    await knex("arsy_model_index_jobs").where({ id: jobId }).update({
      status: "failed",
      last_error: message,
      updated_at: new Date(),
    });
    return "failed";
  }
}
