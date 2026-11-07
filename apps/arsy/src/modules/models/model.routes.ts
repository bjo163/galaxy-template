import { createHash, randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Knex } from "@galaxy/database";

import {
  HttpError,
  requireAccount,
} from "../../core/auth/identity.js";
import {
  extractProjectCredential,
  requireCredentialScope,
  requireProjectCredential,
} from "../../core/auth/project-credential.js";
import {
  canonicalJson,
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

type RecordCursor = {
  version: 1;
  projectId: string;
  modelKey: string;
  filterHash: string;
  createdAt: string;
  id: string;
};

function encodeRecordCursor(cursor: RecordCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeRecordCursor(
  value: string,
  projectId: string,
  modelKey: string,
  filterHash: string,
): RecordCursor {
  if (value.length > 2_048 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new HttpError(400, "The pagination cursor is invalid.");
  }
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (
      parsed.version !== 1 ||
      parsed.projectId !== projectId ||
      parsed.modelKey !== modelKey ||
      parsed.filterHash !== filterHash ||
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(parsed.id)
    ) {
      throw new Error("cursor context mismatch");
    }
    return parsed as RecordCursor;
  } catch {
    throw new HttpError(400, "The pagination cursor is invalid for this query.");
  }
}

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
    .forShare()
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
        return null;
      }
      return trx("arsy_project_users")
        .select("role")
        .where({
          workspace_id: workspaceId,
          project_id: projectId,
          account_id: account.id,
        })
        .first();
    },
  );
  if (!membership) {
    throw new HttpError(404, "The requested project was not found.");
  }

  const roleScopes: Record<string, readonly string[]> = {
    admin: ["models:read", "models:manage", "records:read", "records:write", "addons:manage"],
    developer: ["models:read", "models:manage", "records:read", "records:write"],
    member: ["records:read", "records:write"],
  };
  const scopes = roleScopes[membership.role as string];
  if (!scopes) {
    throw new HttpError(403, "The project membership role is not supported.");
  }

  return {
    accountId: account.id,
    credentialId: null,
    scopes,
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

function fieldIndexExpression(field: ModelField): string {
  const key = field.key.replace(/'/g, "''");
  const extracted = `payload ->> '${key}'`;
  switch (field.type) {
    case "integer":
    case "number":
      return `(${extracted})::numeric`;
    case "boolean":
      return `(${extracted})::boolean`;
    case "date":
      return `(${extracted})::date`;
    case "datetime":
      return `(${extracted})::timestamptz`;
    default:
      return extracted;
  }
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

async function assertModelWritesAllowed(
  trx: Knex.Transaction,
  definitionId: string,
): Promise<void> {
  const job = await trx("arsy_model_migration_jobs as jobs")
    .join("arsy_model_definitions as definitions", "definitions.id", "jobs.definition_id")
    .select("jobs.id")
    .where("jobs.definition_id", definitionId)
    .whereIn("jobs.status", ["queued", "running", "ready"])
    .andWhere(function pendingCutover() {
      this.whereNull("definitions.active_revision")
        .orWhereRaw("definitions.active_revision < jobs.to_revision");
    })
    .first();
  if (job) {
    throw new HttpError(
      409,
      "Writes are temporarily paused while this model revision is being migrated. Retry after the migration is ready.",
    );
  }
}

async function validateExistingRecordsForRevision(
  trx: Knex.Transaction,
  projectId: string,
  modelKey: string,
  revision: number,
  definition: ModelDefinition,
): Promise<void> {
  // Synchronous publication is deliberately bounded. Large backfills need the
  // resumable migration worker tracked in issue #14, not a long HTTP transaction.
  const countRow = await trx("arsy_records")
    .where({ project_id: projectId, model_key: modelKey })
    .count({ total: "id" })
    .first();
  const total = Number(countRow?.total ?? 0);
  if (total > 500) {
    throw new HttpError(
      409,
      "This model has more than 500 records. A resumable data migration is required before publication.",
    );
  }

  const rows = await trx("arsy_records")
    .select("id", "payload")
    .where({ project_id: projectId, model_key: modelKey })
    .orderBy("id", "asc")
    .limit(500);

  for (const row of rows) {
    const existing = readJsonObject(row.payload);
    let normalized: Record<string, unknown>;
    try {
      normalized = validateRecordPayload(definition, existing);
    } catch {
      throw new HttpError(
        409,
        `Model revision ${revision} is incompatible with existing records. A data migration is required before publication.`,
      );
    }
    if (canonicalJson(normalized) !== canonicalJson(existing)) {
      await trx("arsy_records")
        .where({ id: row.id, project_id: projectId, model_key: modelKey })
        .update({
          payload: JSON.stringify(normalized),
          model_revision: revision,
        });
    }
  }
}

function assertIndexDefinitionUnchanged(
  previous: ModelDefinition | undefined,
  next: ModelDefinition,
): void {
  const signature = (definition: ModelDefinition | undefined) =>
    (definition?.fields ?? [])
      .filter((field) => field.indexed)
      .map((field) => ({
        key: field.key,
        type: field.type,
        unique: Boolean(field.unique),
      }))
      .sort((left, right) => left.key.localeCompare(right.key));

  if (canonicalJson(signature(previous)) !== canonicalJson(signature(next))) {
    throw new HttpError(
      409,
      "Index changes are temporarily blocked until the online index lifecycle is available. Keep indexed fields unchanged and retry after the index job is ready.",
    );
  }
}

type IdempotencyRecord = {
  id: string;
  replay?: { statusCode: number; body: unknown };
};

async function beginIdempotency(
  trx: Knex.Transaction,
  actor: ProjectActor,
  method: string,
  routeKey: string,
  key: string | undefined,
  body: unknown,
): Promise<IdempotencyRecord | null> {
  if (!key) return null;
  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(key)) {
    throw new HttpError(400, "Idempotency-Key must contain 16 to 128 safe characters.");
  }
  const keyHash = createHash("sha256").update(key).digest("hex");
  const requestHash = createHash("sha256").update(canonicalJson(body ?? null)).digest("hex");
  const identity = {
    workspace_id: actor.workspaceId,
    project_id: actor.projectId,
    actor_id: actor.accountId,
    method,
    route_key: routeKey,
    key_hash: keyHash,
  };
  const inserted = await trx("arsy_idempotency_keys")
    .insert({
      id: randomUUID(),
      ...identity,
      request_hash: requestHash,
      response_status: null,
      response_body: null,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .onConflict([
      "workspace_id",
      "project_id",
      "actor_id",
      "method",
      "route_key",
      "key_hash",
    ])
    .ignore()
    .returning("id");
  if (inserted.length > 0) return { id: inserted[0].id as string };

  const existing = await trx("arsy_idempotency_keys")
    .select("id", "request_hash as requestHash", "response_status as responseStatus", "response_body as responseBody")
    .where(identity)
    .forUpdate()
    .first();
  if (!existing) {
    throw new HttpError(409, "The idempotent request is currently being processed.");
  }
  if (existing.requestHash !== requestHash) {
    throw new HttpError(409, "Idempotency-Key was already used with a different request.");
  }
  if (existing.responseStatus === null || existing.responseStatus === undefined) {
    throw new HttpError(409, "The idempotent request is currently being processed.");
  }
  return {
    id: existing.id as string,
    replay: {
      statusCode: Number(existing.responseStatus),
      body: existing.responseBody,
    },
  };
}

async function completeIdempotency(
  trx: Knex.Transaction,
  record: IdempotencyRecord | null,
  statusCode: number,
  body: unknown,
): Promise<void> {
  if (!record || record.replay) return;
  await trx("arsy_idempotency_keys")
    .where({ id: record.id })
    .update({ response_status: statusCode, response_body: body ?? null });
}

function getIdempotencyKey(request: FastifyRequest): string | undefined {
  const value = request.headers["idempotency-key"];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "Idempotency-Key must be a single header value.");
  }
  return value;
}

async function resolveDataActor(
  request: FastifyRequest,
  knex: Knex,
): Promise<ProjectActor> {
  // Authentication resolves identity and tenant context only. Each route
  // enforces the scope required by its own operation.
  return resolveProjectActor(request, knex);
}

export async function registerModelRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Params: RouteParams }>(
    "/workspaces/:workspaceId/projects/:projectId/models",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceRole(
        getKnex(app),
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer", "viewer"],
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
          const migrationJob = await trx("arsy_model_migration_jobs")
            .where({
              definition_id: model.id,
              to_revision: request.body.revision,
              status: "ready",
            })
            .first();
          if (!migrationJob) {
            await validateExistingRecordsForRevision(
              trx,
              request.params.projectId,
              request.params.modelKey,
              request.body.revision,
              definition,
            );
          }
          const pendingIndexJob = await trx("arsy_model_index_jobs")
            .where({
              definition_id: model.id,
              revision: request.body.revision,
              operation: "create",
            })
            .whereNotIn("status", ["ready", "removed"])
            .first();
          if (pendingIndexJob) {
            throw new HttpError(
              409,
              "The model revision cannot be published until all required online index jobs are ready.",
            );
          }
          if (migrationJob) {
            if (Number(migrationJob.processed_records) !== Number(migrationJob.total_records)) {
              throw new HttpError(409, "The staged migration record count does not match the migration snapshot.");
            }
            const stagedCount = await trx("arsy_model_migration_records")
              .where({ job_id: migrationJob.id })
              .count({ total: "record_id" })
              .first();
            if (Number(stagedCount?.total ?? 0) !== Number(migrationJob.total_records)) {
              throw new HttpError(409, "The staged payload set is incomplete; retry the migration before publication.");
            }
            await trx("arsy_records as records")
              .join("arsy_model_migration_records as staged", function joinStagedPayload() {
                this.on("staged.record_id", "=", "records.id");
              })
              .where({
                "staged.job_id": migrationJob.id,
                "records.workspace_id": request.params.workspaceId,
                "records.project_id": request.params.projectId,
                "records.definition_id": model.id,
              })
              .update({
                payload: trx.ref("staged.payload"),
                model_revision: request.body.revision,
                updated_at: new Date(),
              });
            await trx("arsy_model_migration_records")
              .where({ job_id: migrationJob.id })
              .delete();
          }
          if (!migrationJob) {
            assertIndexDefinitionUnchanged(previousDefinition, definition);
          }
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
      await requireWorkspaceRole(
        getKnex(app),
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer", "viewer"],
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

  app.post<{ Params: RouteParams; Body: { filter?: unknown; limit?: number; cursor?: string } }>(
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
            cursor: { type: "string", minLength: 1, maxLength: 2048 },
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
          const filterHash = createHash("sha256")
            .update(JSON.stringify(request.body.filter ?? null))
            .digest("hex");
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

          if (request.body.cursor) {
            const cursor = decodeRecordCursor(
              request.body.cursor,
              actor.projectId,
              request.params.modelKey,
              filterHash,
            );
            query.andWhereRaw("(created_at, id) < (?, ?)", [
              new Date(cursor.createdAt),
              cursor.id,
            ]);
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
          const lastRow = rows.at(-1);
          const nextCursor = hasMore && lastRow
            ? encodeRecordCursor({
                version: 1,
                projectId: actor.projectId,
                modelKey: request.params.modelKey,
                filterHash,
                createdAt: new Date(lastRow.createdAt as string).toISOString(),
                id: lastRow.id as string,
              })
            : null;
          return {
            nextCursor,
            data: rows.map((row) => ({
              id: row.id,
              ...readJsonObject(row.payload),
              ownerUserId: row.ownerUserId,
              modelRevision: row.modelRevision,
              createdAt: new Date(row.createdAt as string).toISOString(),
              updatedAt: new Date(row.updatedAt as string).toISOString(),
            })),
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
          await assertModelWritesAllowed(trx, model.definitionId);
          const idempotency = await beginIdempotency(
            trx,
            actor,
            "POST",
            `/data/${request.params.modelKey}`,
            getIdempotencyKey(request),
            request.body,
          );
          if (idempotency?.replay) {
            return reply.code(idempotency.replay.statusCode).send(idempotency.replay.body);
          }
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
          await writeAudit(trx, {
            workspaceId: actor.workspaceId,
            projectId: actor.projectId,
            actorId: actor.accountId,
            action: "record.created",
            resourceType: "record",
            resourceId: id,
            metadata: { modelKey: request.params.modelKey, fieldCount: Object.keys(payload).length },
          });
          const responseBody = {
            id,
            ...payload,
            ownerUserId: actor.accountId,
            modelRevision: model.activeRevision,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };
          await completeIdempotency(trx, idempotency, 201, responseBody);
          return reply.code(201).send(responseBody);
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
          await assertModelWritesAllowed(trx, model.definitionId);
          const idempotency = await beginIdempotency(
            trx,
            actor,
            "PATCH",
            `/data/${request.params.modelKey}/${request.params.recordId}`,
            getIdempotencyKey(request),
            request.body,
          );
          if (idempotency?.replay) {
            return reply.code(idempotency.replay.statusCode).send(idempotency.replay.body);
          }
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
          await writeAudit(trx, {
            workspaceId: actor.workspaceId,
            projectId: actor.projectId,
            actorId: actor.accountId,
            action: "record.updated",
            resourceType: "record",
            resourceId: request.params.recordId as string,
            metadata: { modelKey: request.params.modelKey, changedFields: Object.keys(request.body as Record<string, unknown>) },
          });
          const responseBody = {
            id: row.id,
            ...payload,
            ownerUserId: row.ownerUserId,
            modelRevision: model.activeRevision,
            updatedAt: now.toISOString(),
          };
          await completeIdempotency(trx, idempotency, 200, responseBody);
          return responseBody;
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
          await assertModelWritesAllowed(trx, model.definitionId);
          const idempotency = await beginIdempotency(
            trx,
            actor,
            "DELETE",
            `/data/${request.params.modelKey}/${request.params.recordId}`,
            getIdempotencyKey(request),
            null,
          );
          if (idempotency?.replay) {
            return reply.code(idempotency.replay.statusCode).send();
          }
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
          await writeAudit(trx, {
            workspaceId: actor.workspaceId,
            projectId: actor.projectId,
            actorId: actor.accountId,
            action: "record.deleted",
            resourceType: "record",
            resourceId: request.params.recordId as string,
            metadata: { modelKey: request.params.modelKey },
          });
          await completeIdempotency(trx, idempotency, 204, null);
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
