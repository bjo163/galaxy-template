import { createHash, randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Knex } from "@galaxy/database";

import {
  HttpError,
  requireAccount,
} from "../../core/auth/identity.js";
import {
  decodeTimestampIdCursor,
  encodeTimestampIdCursor,
} from "../../core/pagination.js";
import {
  extractProjectCredential,
  requireCredentialScope,
  requireProjectCredential,
} from "../../core/auth/project-credential.js";
import {
  modelDefinitionHash,
  type ModelDefinition,
  type ModelField,
  validateModelDefinition,
  validateRecordPayload,
} from "../../core/models/model-definition.js";
import {
  withProjectTransaction,
  withWorkspaceTransaction,
} from "../../core/tenancy/database-context.js";

type RouteParams = {
  workspaceId: string;
  projectId: string;
  modelKey: string;
  recordId?: string;
};

type ModelRevisionRow = {
  id: string;
  revision: number;
  definition: ModelDefinition | string;
  status: string;
};

type ProjectActor = {
  accountId: string;
  credentialId: string | null;
  scopes: readonly string[];
  workspaceId: string;
  projectId: string;
};

type FilterExpression =
  | { and: FilterExpression[] }
  | { or: FilterExpression[] }
  | {
      field: string;
      op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "isNull";
      value?: unknown;
    };

function getKnex(app: FastifyInstance): Knex {
  if (!app.database) {
    throw new HttpError(503, "The database is unavailable.");
  }
  return app.database.knex;
}

function readDefinition(value: ModelDefinition | string): ModelDefinition {
  return typeof value === "string" ? JSON.parse(value) as ModelDefinition : value;
}

async function requireWorkspaceRole(
  knex: Knex,
  workspaceId: string,
  accountId: string,
  allowedRoles: readonly string[],
): Promise<string> {
  const membership = await withWorkspaceTransaction(
    knex,
    workspaceId,
    (trx) =>
      trx("arsy_workspace_members")
        .select("role")
        .where({ workspace_id: workspaceId, account_id: accountId })
        .first(),
  );
  if (!membership || !allowedRoles.includes(membership.role as string)) {
    throw new HttpError(404, "The requested workspace was not found.");
  }
  return membership.role as string;
}

async function requireWorkspaceOrProjectMember(
  knex: Knex,
  workspaceId: string,
  projectId: string,
  accountId: string,
): Promise<void> {
  const workspaceMembership = await withWorkspaceTransaction(
    knex,
    workspaceId,
    (trx) =>
      trx("arsy_workspace_members")
        .select("id", "role")
        .where({ workspace_id: workspaceId, account_id: accountId })
        .first(),
  );
  if (
    workspaceMembership &&
    ["owner", "admin", "developer", "viewer"].includes(
      workspaceMembership.role as string,
    )
  ) {
    return;
  }

  const projectMembership = await withProjectTransaction(
    knex,
    workspaceId,
    projectId,
    async (trx) => {
      await requireProject(trx, workspaceId, projectId);
      return trx("arsy_project_users")
        .select("id")
        .where({
          workspace_id: workspaceId,
          project_id: projectId,
          account_id: accountId,
        })
        .first();
    },
  );
  if (!projectMembership) {
    throw new HttpError(404, "The requested project was not found.");
  }
}

async function writeAudit(
  trx: Knex.Transaction,
  input: {
    workspaceId: string;
    projectId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await trx("arsy_audit_events").insert({
    id: randomUUID(),
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    actor_id: input.actorId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    metadata: JSON.stringify(input.metadata ?? {}),
    created_at: new Date(),
  });
}

async function requireProject(
  trx: Knex.Transaction,
  workspaceId: string,
  projectId: string,
): Promise<void> {
  const project = await trx("arsy_projects")
    .select("id")
    .where({
      id: projectId,
      workspace_id: workspaceId,
      status: "active",
    })
    .first();
  if (!project) {
    throw new HttpError(404, "The requested project was not found.");
  }
}

async function getActiveDefinition(
  trx: Knex.Transaction,
  projectId: string,
  modelKey: string,
): Promise<{
  definitionId: string;
  activeRevision: number;
  definition: ModelDefinition;
}> {
  const row = await trx("arsy_model_definitions")
    .join(
      "arsy_model_revisions",
      function joinActiveRevision() {
        this.on(
          "arsy_model_revisions.definition_id",
          "=",
          "arsy_model_definitions.id",
        ).andOn(
          "arsy_model_revisions.revision",
          "=",
          "arsy_model_definitions.active_revision",
        );
      },
    )
    .select(
      "arsy_model_definitions.id as definitionId",
      "arsy_model_definitions.active_revision as activeRevision",
      "arsy_model_revisions.definition as definition",
    )
    .where({
      "arsy_model_definitions.project_id": projectId,
      "arsy_model_definitions.model_key": modelKey,
      "arsy_model_definitions.status": "active",
    })
    .first();
  if (!row) {
    throw new HttpError(404, "The published model was not found.");
  }

  return {
    definitionId: row.definitionId as string,
    activeRevision: row.activeRevision as number,
    definition: readDefinition(row.definition as ModelDefinition | string),
  };
}

async function resolveProjectActor(
  request: FastifyRequest,
  knex: Knex,
  projectIdFromPath?: string,
): Promise<ProjectActor> {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string") {
    throw new HttpError(401, "A project session or credential is required.");
  }

  if (authorization.startsWith("Bearer arsy_proj_")) {
    const secret = extractProjectCredential(request);
    const credential = await requireProjectCredential(knex, secret);
    const workspaceIdHeader = request.headers["x-arsy-workspace-id"];
    const projectIdHeader = request.headers["x-arsy-project-id"];
    if (
      (projectIdFromPath && credential.projectId !== projectIdFromPath) ||
      (typeof workspaceIdHeader === "string" &&
        workspaceIdHeader !== credential.workspaceId) ||
      (typeof projectIdHeader === "string" &&
        projectIdHeader !== credential.projectId)
    ) {
      throw new HttpError(404, "The requested project was not found.");
    }

    return {
      accountId: credential.createdBy,
      credentialId: credential.id,
      scopes: credential.scopes,
      workspaceId: credential.workspaceId,
      projectId: credential.projectId,
    };
  }

  const account = await requireAccount(request, knex);
  const workspaceIdHeader = request.headers["x-arsy-workspace-id"];
  const projectIdHeader = request.headers["x-arsy-project-id"];
  const workspaceId =
    typeof workspaceIdHeader === "string" ? workspaceIdHeader : undefined;
  const projectId =
    projectIdFromPath ??
    (typeof projectIdHeader === "string" ? projectIdHeader : undefined);
  if (
    !workspaceId ||
    !projectId ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(workspaceId) ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(projectId)
  ) {
    throw new HttpError(
      400,
      "User sessions must select a workspace and project using Arsy context headers.",
    );
  }
  const membership = await withProjectTransaction(
    knex,
    workspaceId,
    projectId,
    async (trx) => {
      const project = await trx("arsy_projects")
        .select("id")
        .where({
          id: projectId,
          workspace_id: workspaceId,
          status: "active",
        })
        .first();
      if (!project) {
        return false;
      }
      const [projectMembership, workspaceMembership] = await Promise.all([
        trx("arsy_project_users")
          .select("id")
          .where({
            workspace_id: workspaceId,
            project_id: projectId,
            account_id: account.id,
          })
          .first(),
        trx("arsy_workspace_members")
          .select("id", "role")
          .where({
            workspace_id: workspaceId,
            account_id: account.id,
          })
          .first(),
      ]);
      return Boolean(
        projectMembership ||
          (workspaceMembership &&
            ["owner", "admin", "developer", "viewer"].includes(
              workspaceMembership.role as string,
            )),
      );
    },
  );
  if (!membership) {
    throw new HttpError(404, "The requested project was not found.");
  }

  return {
    accountId: account.id,
    credentialId: null,
    scopes: ["models:read", "records:read", "records:write"],
    workspaceId,
    projectId,
  };
}

function parseDomain(
  value: unknown,
  fields: Map<string, ModelField>,
  depth = 0,
  state = { clauses: 0 },
): FilterExpression {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    depth > 5
  ) {
    throw new HttpError(400, "The query filter has an invalid shape or depth.");
  }
  const filter = value as Record<string, unknown>;
  const combinator = "and" in filter ? "and" : "or" in filter ? "or" : null;
  if (combinator) {
    const children = filter[combinator];
    if (
      Object.keys(filter).length !== 1 ||
      !Array.isArray(children) ||
      children.length === 0
    ) {
      throw new HttpError(400, "A query combinator must contain conditions.");
    }
    const parsedChildren = children.map((child: unknown) =>
      parseDomain(child, fields, depth + 1, state),
    );
    return combinator === "and"
      ? { and: parsedChildren }
      : { or: parsedChildren };
  }

  state.clauses += 1;
  if (state.clauses > 25) {
    throw new HttpError(400, "A query filter may contain at most 25 clauses.");
  }
  const { field, op, value: operand } = filter;
  if (
    Object.keys(filter).some(
      (key) => !["field", "op", "value"].includes(key),
    ) ||
    typeof field !== "string" ||
    typeof op !== "string" ||
    !fields.has(field) ||
    !["eq", "neq", "gt", "gte", "lt", "lte", "in", "isNull"].includes(op)
  ) {
    throw new HttpError(400, "The query filter contains an invalid field or operator.");
  }

  const fieldType = fields.get(field)?.type;
  if (op === "isNull") {
    if (operand !== undefined && typeof operand !== "boolean") {
      throw new HttpError(400, "The isNull filter value must be boolean.");
    }
    return {
      field,
      op,
      value: operand ?? true,
    } as FilterExpression;
  }

  if (op === "in") {
    if (
      !Array.isArray(operand) ||
      operand.length === 0 ||
      operand.length > 100
    ) {
      throw new HttpError(400, "The in filter must contain 1 to 100 values.");
    }
    return {
      field,
      op,
      value: operand,
    } as FilterExpression;
  }

  if (
    operand === undefined ||
    (["gt", "gte", "lt", "lte"].includes(op) &&
      fieldType !== "integer" &&
      fieldType !== "number" &&
      fieldType !== "date" &&
      fieldType !== "datetime")
  ) {
    throw new HttpError(400, "The query filter value is invalid for this field.");
  }

  return { field, op, value: operand } as FilterExpression;
}

function validateFilterValue(field: ModelField, value: unknown): void {
  const probe = validateRecordPayload(
    { key: "probe", displayName: "Probe", fields: [{ ...field, required: true }], access: { defaultVisibility: "project" } },
    { [field.key]: value },
  );
  if (probe[field.key] === undefined) {
    throw new HttpError(400, `The filter value for "${field.key}" is invalid.`);
  }
}

function fieldExpression(field: ModelField): string {
  if (field.type === "integer" || field.type === "number") {
    return "(payload ->> ?)::numeric";
  }
  if (field.type === "boolean") {
    return "(payload ->> ?)::boolean";
  }
  if (field.type === "date") {
    return "(payload ->> ?)::date";
  }
  if (field.type === "datetime") {
    return "(payload ->> ?)::timestamptz";
  }
  return "payload ->> ?";
}

function scalarFilterValue(field: ModelField, value: unknown): string | number | boolean {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    validateFilterValue(field, value);
    return value;
  }
  throw new HttpError(400, `The filter value for "${field.key}" must be scalar.`);
}

function applyDomain(
  query: Knex.QueryBuilder,
  expression: FilterExpression,
  fields: Map<string, ModelField>,
): void {
  if ("and" in expression || "or" in expression) {
    const key = "and" in expression ? "and" : "or";
    const children: FilterExpression[] =
      "and" in expression ? expression.and : expression.or;
    query.where(function applyGroup() {
      children.forEach((child, index) => {
        if (index === 0) {
          applyDomain(this, child, fields);
        } else if (key === "and") {
          this.andWhere(function applyNested() {
            applyDomain(this, child, fields);
          });
        } else {
          this.orWhere(function applyNested() {
            applyDomain(this, child, fields);
          });
        }
      });
    });
    return;
  }

  const field = fields.get(expression.field);
  if (!field) {
    throw new HttpError(400, "The query references an unknown model field.");
  }
  if (expression.op === "isNull") {
    query.whereRaw(
      `payload -> ? IS ${expression.value ? "" : "NOT "}NULL`,
      [expression.field],
    );
    return;
  }
  if (expression.op === "in") {
    const values = (expression.value as unknown[]).map((value) =>
      scalarFilterValue(field, value),
    );
    const placeholders = values.map(() => "?").join(", ");
    query.whereRaw(
      `${fieldExpression(field)} IN (${placeholders})`,
      [expression.field, ...values],
    );
    return;
  }

  const operator = {
    eq: "=",
    neq: "<>",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
  }[expression.op];
  if (!operator) {
    throw new HttpError(400, "The query operator is unsupported.");
  }
  query.whereRaw(
    `${fieldExpression(field)} ${operator} ?`,
    [expression.field, scalarFilterValue(field, expression.value)],
  );
}

function getIndexName(
  projectId: string,
  modelKey: string,
  fieldKey: string,
): string {
  const digest = createHash("sha256")
    .update(`${projectId}:${modelKey}:${fieldKey}`)
    .digest("hex")
    .slice(0, 40);
  return `arsy_field_${digest}`;
}

async function recreateFieldIndexes(
  trx: Knex.Transaction,
  projectId: string,
  modelKey: string,
  previous: ModelDefinition | undefined,
  next: ModelDefinition,
): Promise<void> {
  const indexedFields = new Map<string, ModelField>();
  for (const field of [...(previous?.fields ?? []), ...next.fields]) {
    if (field.indexed) {
      indexedFields.set(field.key, field);
    }
  }

  for (const field of indexedFields.values()) {
    const indexName = getIndexName(projectId, modelKey, field.key);
    await trx.raw("DROP INDEX IF EXISTS ??", [indexName]);
  }

  for (const field of next.fields.filter((candidate) => candidate.indexed)) {
    const indexName = getIndexName(projectId, modelKey, field.key);
    const unique = field.unique ? "UNIQUE " : "";
    await trx.raw(
      `CREATE ${unique}INDEX ?? ON "arsy_records" ("workspace_id", "project_id", "model_key", (payload ->> '${field.key}'))`,
      [indexName],
    );
  }
}

async function resolveDataActor(
  request: FastifyRequest,
  knex: Knex,
): Promise<ProjectActor> {
  const actor = await resolveProjectActor(request, knex);
  if (actor.credentialId) {
    requireCredentialScope(actor, "records:read");
  }
  return actor;
}

export async function registerModelRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Params: RouteParams }>(
    "/workspaces/:workspaceId/projects/:projectId/models",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceOrProjectMember(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        account.id,
      );

      const data = await withProjectTransaction(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          return trx("arsy_model_definitions")
            .select(
              "id",
              "model_key as key",
              "display_name as displayName",
              "active_revision as activeRevision",
              "status",
              "created_at as createdAt",
              "updated_at as updatedAt",
            )
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
            })
            .orderBy("model_key", "asc");
        },
      );
      return {
        data: data.map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt as string).toISOString(),
          updatedAt: new Date(row.updatedAt as string).toISOString(),
        })),
      };
    },
  );

  app.post<{ Params: RouteParams; Body: unknown }>(
    "/workspaces/:workspaceId/projects/:projectId/models",
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer"],
      );
      const definition = validateModelDefinition(request.body);
      const now = new Date();
      const definitionId = randomUUID();
      const revisionId = randomUUID();

      await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          const existing = await trx("arsy_model_definitions")
            .select("id")
            .where({
              project_id: request.params.projectId,
              model_key: definition.key,
            })
            .first();
          if (existing) {
            throw new HttpError(409, "A model with this key already exists.");
          }
          await trx("arsy_model_definitions").insert({
            id: definitionId,
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            model_key: definition.key,
            display_name: definition.displayName,
            active_revision: null,
            status: "active",
            created_by: account.id,
            created_at: now,
            updated_at: now,
          });
          await trx("arsy_model_revisions").insert({
            id: revisionId,
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            definition_id: definitionId,
            revision: 1,
            definition: JSON.stringify(definition),
            status: "draft",
            content_hash: modelDefinitionHash(definition),
            created_by: account.id,
            created_at: now,
          });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: account.id,
            action: "model.draft_created",
            resourceType: "model",
            resourceId: definitionId,
            metadata: { key: definition.key, revision: 1 },
          });
        },
      );

      return reply.code(201).send({
        id: definitionId,
        key: definition.key,
        displayName: definition.displayName,
        activeRevision: null,
        draftRevision: {
          id: revisionId,
          revision: 1,
          status: "draft",
          contentHash: modelDefinitionHash(definition),
          definition,
        },
        createdAt: now.toISOString(),
      });
    },
  );

  app.post<{ Params: RouteParams; Body: unknown }>(
    "/workspaces/:workspaceId/projects/:projectId/models/:modelKey/revisions",
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer"],
      );
      const definition = validateModelDefinition(request.body);
      if (definition.key !== request.params.modelKey) {
        throw new HttpError(400, "The revision model key must match the route.");
      }

      const revision = await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          const model = await trx("arsy_model_definitions")
            .select("id")
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              model_key: request.params.modelKey,
              status: "active",
            })
            .first();
          if (!model) {
            throw new HttpError(404, "The model was not found.");
          }
          const latest = await trx("arsy_model_revisions")
            .max({ revision: "revision" })
            .where({ definition_id: model.id })
            .first();
          const revisionNumber = Number(latest?.revision ?? 0) + 1;
          const revisionId = randomUUID();
          const now = new Date();
          await trx("arsy_model_revisions").insert({
            id: revisionId,
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            definition_id: model.id,
            revision: revisionNumber,
            definition: JSON.stringify(definition),
            status: "draft",
            content_hash: modelDefinitionHash(definition),
            created_by: account.id,
            created_at: now,
          });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: account.id,
            action: "model.revision_created",
            resourceType: "model",
            resourceId: model.id as string,
            metadata: { key: definition.key, revision: revisionNumber },
          });
          return {
            id: revisionId,
            revision: revisionNumber,
            createdAt: now,
          };
        },
      );

      return reply.code(201).send({
        ...revision,
        createdAt: revision.createdAt.toISOString(),
        status: "draft",
        contentHash: modelDefinitionHash(definition),
        definition,
      });
    },
  );

  app.post<{ Params: RouteParams; Body: { revision: number } }>(
    "/workspaces/:workspaceId/projects/:projectId/models/:modelKey/publish",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["revision"],
          properties: { revision: { type: "integer", minimum: 1 } },
        },
      },
    },
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer"],
      );

      return withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          const model = await trx("arsy_model_definitions")
            .select(
              "id",
              "active_revision as activeRevision",
              "model_key as modelKey",
            )
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              model_key: request.params.modelKey,
              status: "active",
            })
            .forUpdate()
            .first();
          if (!model) {
            throw new HttpError(404, "The model was not found.");
          }

          const next = (await trx("arsy_model_revisions")
            .select(
              "id",
              "revision",
              "definition",
              "status",
            )
            .where({
              definition_id: model.id,
              revision: request.body.revision,
              status: "draft",
            })
            .forUpdate()
            .first()) as ModelRevisionRow | undefined;
          if (!next) {
            throw new HttpError(404, "The draft model revision was not found.");
          }

          const definition = validateModelDefinition(readDefinition(next.definition));
          const previous = model.activeRevision
            ? await getActiveDefinition(
                trx,
                request.params.projectId,
                request.params.modelKey,
              )
            : undefined;
          const previousDefinition = previous?.definition;
          await recreateFieldIndexes(
            trx,
            request.params.projectId,
            request.params.modelKey,
            previousDefinition,
            definition,
          );
          await trx("arsy_model_revisions")
            .where({ id: next.id })
            .update({ status: "published" });
          await trx("arsy_model_definitions")
            .where({ id: model.id })
            .update({
              active_revision: request.body.revision,
              display_name: definition.displayName,
              updated_at: new Date(),
            });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: account.id,
            action: "model.published",
            resourceType: "model",
            resourceId: model.id as string,
            metadata: {
              key: request.params.modelKey,
              revision: request.body.revision,
              contentHash: modelDefinitionHash(definition),
            },
          });
          return {
            key: request.params.modelKey,
            revision: request.body.revision,
            definition,
            publishedAt: new Date().toISOString(),
          };
        },
      );
    },
  );

  app.get<{ Params: RouteParams }>(
    "/workspaces/:workspaceId/projects/:projectId/models/:modelKey/revisions",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceOrProjectMember(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        account.id,
      );
      const revisions = await withProjectTransaction(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          return trx("arsy_model_revisions")
            .join(
              "arsy_model_definitions",
              "arsy_model_definitions.id",
              "arsy_model_revisions.definition_id",
            )
            .select(
              "arsy_model_revisions.id",
              "arsy_model_revisions.revision",
              "arsy_model_revisions.definition",
              "arsy_model_revisions.status",
              "arsy_model_revisions.content_hash as contentHash",
              "arsy_model_revisions.created_at as createdAt",
            )
            .where({
              "arsy_model_definitions.workspace_id": request.params.workspaceId,
              "arsy_model_definitions.project_id": request.params.projectId,
              "arsy_model_definitions.model_key": request.params.modelKey,
            })
            .orderBy("arsy_model_revisions.revision", "desc");
        },
      );
      return {
        data: revisions.map((row) => ({
          ...row,
          definition: readDefinition(row.definition as ModelDefinition | string),
          createdAt: new Date(row.createdAt as string).toISOString(),
        })),
      };
    },
  );

  app.post<{
    Params: RouteParams;
    Body: { filter?: unknown; limit?: number; cursor?: string };
  }>(
    "/data/:modelKey/query",
    {
      schema: {
        params: {
          type: "object",
          required: ["modelKey"],
          properties: { modelKey: { type: "string", pattern: "^[a-z][a-z0-9_]{0,62}$" } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            filter: { type: "object" },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            cursor: { type: "string", minLength: 1, maxLength: 256 },
          },
        },
      },
    },
    async (request) => {
      const knex = getKnex(app);
      const actor = await resolveDataActor(request, knex);
      requireCredentialScope(actor, "records:read");
      return withProjectTransaction(
        knex,
        actor.workspaceId,
        actor.projectId,
        async (trx) => {
          const model = await getActiveDefinition(
            trx,
            actor.projectId,
            request.params.modelKey,
          );
          const fieldMap = new Map(
            model.definition.fields.map((field) => [field.key, field]),
          );
          const limit = request.body.limit ?? 50;
          const cursor = decodeTimestampIdCursor(request.body.cursor);
          const query = trx("arsy_records")
            .select(
              "id",
              "payload",
              "owner_user_id as ownerUserId",
              "created_by as createdBy",
              "updated_by as updatedBy",
              "model_revision as modelRevision",
              "created_at as createdAt",
              "updated_at as updatedAt",
            )
            .where({
              workspace_id: actor.workspaceId,
              project_id: actor.projectId,
              model_key: request.params.modelKey,
            })
            .orderBy("created_at", "desc")
            .orderBy("id", "desc")
            .limit(limit + 1);

          if (cursor) {
            query.andWhere(function applyCursor() {
              this.where("created_at", "<", cursor.createdAt).orWhere(
                function applyCursorTieBreak() {
                  this.where("created_at", cursor.createdAt).andWhere(
                    "id",
                    "<",
                    cursor.id,
                  );
                },
              );
            });
          }

          if (model.definition.access.defaultVisibility === "private") {
            query.andWhere("owner_user_id", actor.accountId);
          }
          if (request.body.filter !== undefined) {
            applyDomain(
              query,
              parseDomain(request.body.filter, fieldMap),
              fieldMap,
            );
          }
          const fetchedRows = await query;
          const hasMore = fetchedRows.length > limit;
          const rows = fetchedRows.slice(0, limit);
          const lastRow = rows[rows.length - 1];
          return {
            data: rows.map((row) => ({
              id: row.id,
              ...readJsonObject(row.payload),
              ownerUserId: row.ownerUserId,
              modelRevision: row.modelRevision,
              createdAt: new Date(row.createdAt as string).toISOString(),
              updatedAt: new Date(row.updatedAt as string).toISOString(),
            })),
            nextCursor:
              hasMore && lastRow
                ? encodeTimestampIdCursor(
                    lastRow.createdAt as Date | string,
                    lastRow.id as string,
                  )
                : null,
          };
        },
      );
    },
  );

  app.post<{ Params: RouteParams; Body: unknown }>(
    "/data/:modelKey",
    {
      schema: {
        params: {
          type: "object",
          required: ["modelKey"],
          properties: { modelKey: { type: "string", pattern: "^[a-z][a-z0-9_]{0,62}$" } },
        },
        body: { type: "object", additionalProperties: true },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const actor = await resolveDataActor(request, knex);
      requireCredentialScope(actor, "records:write");
      return withProjectTransaction(
        knex,
        actor.workspaceId,
        actor.projectId,
        async (trx) => {
          const model = await getActiveDefinition(
            trx,
            actor.projectId,
            request.params.modelKey,
          );
          const payload = validateRecordPayload(model.definition, request.body);
          const now = new Date();
          const id = randomUUID();
          try {
            await trx("arsy_records").insert({
              id,
              workspace_id: actor.workspaceId,
              project_id: actor.projectId,
              definition_id: model.definitionId,
              model_key: request.params.modelKey,
              owner_user_id: actor.accountId,
              created_by: actor.accountId,
              updated_by: actor.accountId,
              model_revision: model.activeRevision,
              payload: JSON.stringify(payload),
              created_at: now,
              updated_at: now,
            });
          } catch (error) {
            if (isUniqueViolation(error)) {
              throw new HttpError(409, "A record violates a unique model field.");
            }
            throw error;
          }
          return reply.code(201).send({
            id,
            ...payload,
            ownerUserId: actor.accountId,
            modelRevision: model.activeRevision,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        },
      );
    },
  );

  app.get<{ Params: RouteParams }>(
    "/data/:modelKey/:recordId",
    async (request) => {
      const actor = await resolveDataActor(request, getKnex(app));
      requireCredentialScope(actor, "records:read");
      return withProjectTransaction(
        getKnex(app),
        actor.workspaceId,
        actor.projectId,
        async (trx) => {
          const model = await getActiveDefinition(
            trx,
            actor.projectId,
            request.params.modelKey,
          );
          const query = trx("arsy_records")
            .select(
              "id",
              "payload",
              "owner_user_id as ownerUserId",
              "model_revision as modelRevision",
              "created_at as createdAt",
              "updated_at as updatedAt",
            )
            .where({
              id: request.params.recordId,
              workspace_id: actor.workspaceId,
              project_id: actor.projectId,
              model_key: request.params.modelKey,
            });
          if (model.definition.access.defaultVisibility === "private") {
            query.andWhere("owner_user_id", actor.accountId);
          }
          const row = await query.first();
          if (!row) {
            throw new HttpError(404, "The record was not found.");
          }
          return {
            id: row.id,
            ...readJsonObject(row.payload),
            ownerUserId: row.ownerUserId,
            modelRevision: row.modelRevision,
            createdAt: new Date(row.createdAt as string).toISOString(),
            updatedAt: new Date(row.updatedAt as string).toISOString(),
          };
        },
      );
    },
  );

  app.patch<{ Params: RouteParams; Body: unknown }>(
    "/data/:modelKey/:recordId",
    {
      schema: {
        body: { type: "object", additionalProperties: true },
      },
    },
    async (request) => {
      const actor = await resolveProjectActor(request, getKnex(app));
      requireCredentialScope(actor, "records:write");
      return withProjectTransaction(
        getKnex(app),
        actor.workspaceId,
        actor.projectId,
        async (trx) => {
          const model = await getActiveDefinition(
            trx,
            actor.projectId,
            request.params.modelKey,
          );
          const query = trx("arsy_records")
            .select("id", "payload", "owner_user_id as ownerUserId")
            .where({
              id: request.params.recordId,
              workspace_id: actor.workspaceId,
              project_id: actor.projectId,
              model_key: request.params.modelKey,
            })
            .forUpdate();
          if (model.definition.access.defaultVisibility === "private") {
            query.andWhere("owner_user_id", actor.accountId);
          }
          const row = await query.first();
          if (!row) {
            throw new HttpError(404, "The record was not found.");
          }
          const payload = validateRecordPayload(
            model.definition,
            request.body,
            readJsonObject(row.payload),
          );
          const now = new Date();
          await trx("arsy_records")
            .where({
              id: request.params.recordId,
              workspace_id: actor.workspaceId,
              project_id: actor.projectId,
              model_key: request.params.modelKey,
            })
            .update({
              payload: JSON.stringify(payload),
              updated_by: actor.accountId,
              model_revision: model.activeRevision,
              updated_at: now,
            });
          return {
            id: row.id,
            ...payload,
            ownerUserId: row.ownerUserId,
            modelRevision: model.activeRevision,
            updatedAt: now.toISOString(),
          };
        },
      );
    },
  );

  app.delete<{ Params: RouteParams }>(
    "/data/:modelKey/:recordId",
    async (request, reply) => {
      const actor = await resolveProjectActor(request, getKnex(app));
      requireCredentialScope(actor, "records:write");
      return withProjectTransaction(
        getKnex(app),
        actor.workspaceId,
        actor.projectId,
        async (trx) => {
          const model = await getActiveDefinition(
            trx,
            actor.projectId,
            request.params.modelKey,
          );
          const query = trx("arsy_records").where({
            id: request.params.recordId,
            workspace_id: actor.workspaceId,
            project_id: actor.projectId,
            model_key: request.params.modelKey,
          });
          if (model.definition.access.defaultVisibility === "private") {
            query.andWhere("owner_user_id", actor.accountId);
          }
          const deleted = await query.delete();
          if (deleted === 0) {
            throw new HttpError(404, "The record was not found.");
          }
          return reply.code(204).send();
        },
      );
    },
  );
}

function readJsonObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Stored record payload is not a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
