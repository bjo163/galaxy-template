import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";

import { HttpError, requireAccount } from "../../core/auth/identity.js";
import {
  canonicalJson,
  validateModelDefinition,
  validateRecordPayload,
  type ModelDefinition,
} from "../../core/models/model-definition.js";
import { withProjectTransaction, withWorkspaceTransaction } from "../../core/tenancy/database-context.js";
import {
  applyModelMigrationPlan,
  makeModelIndexName,
} from "./model-lifecycle.js";

type Params = {
  workspaceId: string;
  projectId: string;
  modelKey: string;
  revision: string;
  jobId?: string;
};

type Operation = {
  op: "rename" | "set_default" | "remove";
  field: string;
  to?: string;
  value?: unknown;
};

function classifyRevision(previous: ModelDefinition | null, next: ModelDefinition): "compatible" | "conditional" | "breaking" {
  if (!previous) return "compatible";
  const oldFields = new Map(previous.fields.map((field) => [field.key, field]));
  const newFields = new Map(next.fields.map((field) => [field.key, field]));
  for (const oldField of previous.fields) {
    const nextField = newFields.get(oldField.key);
    if (!nextField || nextField.type !== oldField.type) return "breaking";
    if (nextField.required && !oldField.required && nextField.default === undefined) return "breaking";
    if (canonicalJson(nextField.enum ?? []) !== canonicalJson(oldField.enum ?? [])) return "conditional";
  }
  if (next.fields.some((field) => !oldFields.has(field.key))) {
    return next.fields.some((field) => {
      const old = oldFields.get(field.key);
      return !old && field.required && field.default === undefined;
    }) ? "breaking" : "conditional";
  }
  return "compatible";
}

function indexedFields(definition: ModelDefinition | null): Map<string, ModelDefinition["fields"][number]> {
  return new Map((definition?.fields ?? []).filter((field) => field.indexed).map((field) => [field.key, field]));
}

export async function registerModelLifecycleRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: Params; Body: { operations: Operation[] } }>(
    "/workspaces/:workspaceId/projects/:projectId/models/:modelKey/revisions/:revision/migration-preview",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["operations"],
          properties: {
            operations: { type: "array", maxItems: 100, items: { type: "object" } },
          },
        },
      },
    },
    async (request) => {
      const knex = app.database?.knex;
      if (!knex) throw new HttpError(503, "The database is unavailable.");
      const account = await requireAccount(request, knex);
      const role = await withWorkspaceTransaction(knex, request.params.workspaceId, async (trx) =>
        trx("arsy_workspace_members").select("role").where({
          workspace_id: request.params.workspaceId,
          account_id: account.id,
        }).first(),
      );
      if (!role || !["owner", "admin", "developer"].includes(role.role as string)) {
        throw new HttpError(404, "The requested workspace was not found.");
      }

      return withProjectTransaction(knex, request.params.workspaceId, request.params.projectId, async (trx) => {
        const model = await trx("arsy_model_definitions").select("id", "active_revision as activeRevision")
          .where({
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            model_key: request.params.modelKey,
            status: "active",
          }).first();
        if (!model) throw new HttpError(404, "The model was not found.");
        const revision = Number(request.params.revision);
        const draft = await trx("arsy_model_revisions").select("definition", "status")
          .where({ definition_id: model.id, revision, status: "draft" }).first();
        if (!draft) throw new HttpError(404, "The draft model revision was not found.");
        const target = validateModelDefinition(typeof draft.definition === "string" ? JSON.parse(draft.definition) : draft.definition);
        const previousRow = model.activeRevision ? await trx("arsy_model_revisions")
          .select("definition").where({ definition_id: model.id, revision: model.activeRevision }).first() : null;
        const previous = previousRow
          ? validateModelDefinition(typeof previousRow.definition === "string" ? JSON.parse(previousRow.definition) : previousRow.definition)
          : null;
        const plan = { operations: request.body.operations, targetDefinition: target };
        const count = await trx("arsy_records").where({
          workspace_id: request.params.workspaceId,
          project_id: request.params.projectId,
          definition_id: model.id,
        }).count({ total: "id" }).first();
        const sample = await trx("arsy_records").select("id", "payload").where({
          workspace_id: request.params.workspaceId,
          project_id: request.params.projectId,
          definition_id: model.id,
        }).orderBy("id", "asc").limit(100);
        let invalidSamples = 0;
        for (const row of sample) {
          try {
            const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
            validateRecordPayload(target, applyModelMigrationPlan(payload as Record<string, unknown>, plan));
          } catch {
            invalidSamples += 1;
          }
        }
        return {
          modelKey: request.params.modelKey,
          revision,
          changeClass: classifyRevision(previous, target),
          totalRecords: Number(count?.total ?? 0),
          sampledRecords: sample.length,
          sampleTruncated: sample.length < Number(count?.total ?? 0),
          invalidSamples,
          canEnqueue: invalidSamples === 0,
          requiredIndexChanges: {
            create: [...indexedFields(target)].filter(([key, field]) => {
              const old = indexedFields(previous).get(key);
              return !old || old.type !== field.type || old.unique !== field.unique;
            }).map(([key]) => key),
            retire: [...indexedFields(previous)].filter(([key, field]) => {
              const next = indexedFields(target).get(key);
              return !next || next.type !== field.type || next.unique !== field.unique;
            }).map(([key]) => key),
          },
        };
      });
    },
  );

  app.post<{ Params: Params; Body: { operations: Operation[] } }>(
    "/workspaces/:workspaceId/projects/:projectId/models/:modelKey/revisions/:revision/migration-jobs",
    async (request, reply) => {
      const knex = app.database?.knex;
      if (!knex) throw new HttpError(503, "The database is unavailable.");
      const account = await requireAccount(request, knex);
      const role = await withWorkspaceTransaction(knex, request.params.workspaceId, async (trx) =>
        trx("arsy_workspace_members").select("role").where({
          workspace_id: request.params.workspaceId,
          account_id: account.id,
        }).first(),
      );
      if (!role || !["owner", "admin", "developer"].includes(role.role as string)) {
        throw new HttpError(404, "The requested workspace was not found.");
      }

      const result = await withProjectTransaction(knex, request.params.workspaceId, request.params.projectId, async (trx) => {
        const model = await trx("arsy_model_definitions").select("id", "active_revision as activeRevision")
          .where({
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            model_key: request.params.modelKey,
            status: "active",
          }).forUpdate().first();
        if (!model) throw new HttpError(404, "The model was not found.");
        const revision = Number(request.params.revision);
        const draft = await trx("arsy_model_revisions").select("definition", "status")
          .where({ definition_id: model.id, revision, status: "draft" }).first();
        if (!draft) throw new HttpError(404, "The draft model revision was not found.");
        const target = validateModelDefinition(typeof draft.definition === "string" ? JSON.parse(draft.definition) : draft.definition);
        const previousRow = model.activeRevision ? await trx("arsy_model_revisions")
          .select("definition").where({ definition_id: model.id, revision: model.activeRevision }).first() : null;
        const previous = previousRow
          ? validateModelDefinition(typeof previousRow.definition === "string" ? JSON.parse(previousRow.definition) : previousRow.definition)
          : null;
        const plan = { operations: request.body.operations, targetDefinition: target };
        const totalRow = await trx("arsy_records").where({
          workspace_id: request.params.workspaceId,
          project_id: request.params.projectId,
          definition_id: model.id,
        }).count({ total: "id" }).first();
        const sample = await trx("arsy_records").select("payload").where({
          workspace_id: request.params.workspaceId,
          project_id: request.params.projectId,
          definition_id: model.id,
        }).orderBy("id", "asc").limit(100);
        for (const row of sample) {
          const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
          validateRecordPayload(target, applyModelMigrationPlan(payload as Record<string, unknown>, plan));
        }

        const existing = await trx("arsy_model_migration_jobs").select("id")
          .where({ definition_id: model.id, to_revision: revision })
          .whereIn("status", ["queued", "running", "ready"]).first();
        if (existing) throw new HttpError(409, "A migration job already exists for this revision.");

        const id = randomUUID();
        const now = new Date();
        await trx("arsy_model_migration_jobs").insert({
          id,
          workspace_id: request.params.workspaceId,
          project_id: request.params.projectId,
          definition_id: model.id,
          from_revision: model.activeRevision,
          to_revision: revision,
          status: "queued",
          change_class: classifyRevision(previous, target),
          plan: JSON.stringify(plan),
          total_records: Number(totalRow?.total ?? 0),
          processed_records: 0,
          failed_records: 0,
          created_by: account.id,
          created_at: now,
          updated_at: now,
        });

        const oldIndexes = indexedFields(previous);
        const nextIndexes = indexedFields(target);
        for (const [key, field] of nextIndexes) {
          const old = oldIndexes.get(key);
          if (old && old.type === field.type && old.unique === field.unique) continue;
          const indexName = makeModelIndexName(request.params.projectId, request.params.modelKey, key, field.unique);
          await trx("arsy_model_index_jobs").insert({
            id: randomUUID(),
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            definition_id: model.id,
            model_key: request.params.modelKey,
            revision,
            field_key: key,
            field_type: field.type,
            is_unique: field.unique,
            index_name: indexName,
            operation: "create",
            status: "requested",
            attempts: 0,
            created_by: account.id,
            created_at: now,
            updated_at: now,
          }).onConflict("index_name").ignore();
        }
        for (const [key, field] of oldIndexes) {
          const next = nextIndexes.get(key);
          if (next && next.type === field.type && next.unique === field.unique) continue;
          const indexName = makeModelIndexName(request.params.projectId, request.params.modelKey, key, field.unique);
          await trx("arsy_model_index_jobs").insert({
            id: randomUUID(),
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            definition_id: model.id,
            model_key: request.params.modelKey,
            revision,
            field_key: key,
            field_type: field.type,
            is_unique: field.unique,
            index_name: indexName,
            operation: "drop",
            status: "requested",
            attempts: 0,
            created_by: account.id,
            created_at: now,
            updated_at: now,
          }).onConflict("index_name").ignore();
        }
        return { id, status: "queued", revision, totalRecords: Number(totalRow?.total ?? 0) };
      });
      return reply.code(202).send(result);
    },
  );

  app.get<{ Params: Params }>(
    "/workspaces/:workspaceId/projects/:projectId/models/:modelKey/migration-jobs",
    async (request) => {
      const knex = app.database?.knex;
      if (!knex) throw new HttpError(503, "The database is unavailable.");
      const account = await requireAccount(request, knex);
      const role = await withWorkspaceTransaction(knex, request.params.workspaceId, async (trx) =>
        trx("arsy_workspace_members").select("role").where({
          workspace_id: request.params.workspaceId,
          account_id: account.id,
        }).first(),
      );
      if (!role) throw new HttpError(404, "The requested workspace was not found.");
      return withProjectTransaction(knex, request.params.workspaceId, request.params.projectId, async (trx) => ({
        data: await trx("arsy_model_migration_jobs")
          .select("id", "from_revision as fromRevision", "to_revision as toRevision", "status", "change_class as changeClass", "total_records as totalRecords", "processed_records as processedRecords", "failed_records as failedRecords", "last_error as lastError", "created_at as createdAt", "completed_at as completedAt")
          .where({ workspace_id: request.params.workspaceId, project_id: request.params.projectId, definition_id: trx("arsy_model_definitions").select("id").where({ project_id: request.params.projectId, model_key: request.params.modelKey }) })
          .orderBy("created_at", "desc")
          .limit(50),
      }));
    },
  );
}
