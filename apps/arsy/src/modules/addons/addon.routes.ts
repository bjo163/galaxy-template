import { randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Knex } from "@galaxy/database";

import {
  addonManifestHash,
  addonManifestBodySchema,
  decodeAddonManifest,
  type AddonManifest,
  validateAddonConfiguration,
  validateAddonManifest,
} from "../../core/addons/addon-manifest.js";
import { canonicalJson } from "../../core/models/model-definition.js";
import { HttpError, requireAccount } from "../../core/auth/identity.js";
import {
  extractProjectCredential,
  requireCredentialScope,
  requireProjectCredential,
} from "../../core/auth/project-credential.js";
import {
  withProjectTransaction,
  withWorkspaceTransaction,
} from "../../core/tenancy/database-context.js";

type RouteParams = {
  workspaceId: string;
  projectId: string;
  addonId: string;
  version: string;
  installationId: string;
};

type InstallBody = {
  grantedCapabilities: string[];
  configuration: Record<string, unknown>;
};

function getKnex(app: FastifyInstance): Knex {
  if (!app.database) {
    throw new HttpError(503, "The database is unavailable.");
  }
  return app.database.knex;
}

function decodeJsonValue(value: unknown): unknown {
  return typeof value === "string" ? JSON.parse(value) as unknown : value;
}

async function requireAddonManager(
  request: FastifyRequest,
  knex: Knex,
  workspaceId: string,
  projectId: string,
): Promise<{ accountId: string }> {
  const authorization = request.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer arsy_proj_")) {
    const credential = await requireProjectCredential(
      knex,
      extractProjectCredential(request),
    );
    if (
      credential.workspaceId !== workspaceId ||
      credential.projectId !== projectId
    ) {
      throw new HttpError(404, "The requested project was not found.");
    }
    requireCredentialScope(credential, "addons:manage");
    return { accountId: credential.createdBy };
  }

  const account = await requireAccount(request, knex);
  const member = await withWorkspaceTransaction(
    knex,
    workspaceId,
    (trx) =>
      trx("arsy_workspace_members")
        .select("role")
        .where({ workspace_id: workspaceId, account_id: account.id })
        .first(),
  );
  if (!member || !["owner", "admin", "developer"].includes(member.role as string)) {
    throw new HttpError(404, "The requested workspace was not found.");
  }
  return { accountId: account.id };
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

async function requireDefinition(
  trx: Knex.Transaction,
  workspaceId: string,
  projectId: string,
  addonId: string,
  version: string,
): Promise<{
  id: string;
  status: string;
  manifest: AddonManifest;
}> {
  const row = await trx("arsy_addon_definitions")
    .select("id", "status", "manifest")
    .where({
      workspace_id: workspaceId,
      project_id: projectId,
      addon_id: addonId,
      version,
    })
    .first();
  if (!row) {
    throw new HttpError(404, "The add-on definition was not found.");
  }
  return {
    id: row.id as string,
    status: row.status as string,
    manifest: decodeAddonManifest(row.manifest),
  };
}

async function validateUiModelReferences(
  trx: Knex.Transaction,
  projectId: string,
  manifest: AddonManifest,
): Promise<void> {
  if (!manifest.ui?.length) {
    return;
  }
  if (!manifest.capabilities.includes("models.read")) {
    throw new HttpError(400, "Add-on UI pages require the models.read capability.");
  }

  for (const page of manifest.ui) {
    const model = await trx("arsy_model_definitions")
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
      .select("arsy_model_revisions.definition")
      .where({
        "arsy_model_definitions.project_id": projectId,
        "arsy_model_definitions.model_key": page.modelKey,
        "arsy_model_definitions.status": "active",
      })
      .first();
    if (!model) {
      throw new HttpError(
        400,
        `Add-on UI page "${page.id}" references an unpublished model.`,
      );
    }

    const definition =
      typeof model.definition === "string"
        ? JSON.parse(model.definition) as { fields: Array<{ key: string }> }
        : model.definition as { fields: Array<{ key: string }> };
    const modelFields = new Set(definition.fields.map((field) => field.key));
    if (page.fields.some((field) => !modelFields.has(field))) {
      throw new HttpError(
        400,
        `Add-on UI page "${page.id}" references an unknown model field.`,
      );
    }
  }
}

async function requireEnabledDependencies(
  trx: Knex.Transaction,
  workspaceId: string,
  projectId: string,
  manifest: AddonManifest,
): Promise<void> {
  for (const dependency of manifest.dependencies) {
    const installed = await trx("arsy_addon_definitions")
      .join(
        "arsy_addon_installations",
        "arsy_addon_installations.definition_id",
        "arsy_addon_definitions.id",
      )
      .select("arsy_addon_installations.status")
      .where({
        "arsy_addon_definitions.workspace_id": workspaceId,
        "arsy_addon_definitions.project_id": projectId,
        "arsy_addon_definitions.addon_id": dependency.id,
        "arsy_addon_definitions.version": dependency.version,
        "arsy_addon_installations.status": "enabled",
      })
      .first();
    if (!installed) {
      throw new HttpError(409, `Required add-on "${dependency.id}" is not enabled.`);
    }
  }
}

async function requireNoEnabledDependents(
  trx: Knex.Transaction,
  workspaceId: string,
  projectId: string,
  addonId: string,
  version: string,
  installationId: string,
): Promise<void> {
  const dependents = await trx("arsy_addon_installations")
    .join(
      "arsy_addon_definitions",
      "arsy_addon_definitions.id",
      "arsy_addon_installations.definition_id",
    )
    .select("arsy_addon_installations.id", "arsy_addon_definitions.manifest")
    .where({
      "arsy_addon_installations.workspace_id": workspaceId,
      "arsy_addon_installations.project_id": projectId,
      "arsy_addon_installations.status": "enabled",
    });

  if (
    dependents.some((dependent) => {
      if (dependent.id === installationId) {
        return false;
      }
      const manifest = decodeAddonManifest(dependent.manifest);
      return manifest.dependencies.some(
        (dependency) => dependency.id === addonId && dependency.version === version,
      );
    })
  ) {
    throw new HttpError(
      409,
      "Disable enabled dependent add-ons before disabling this add-on.",
    );
  }
}

export async function registerAddonRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: RouteParams }>(
    "/workspaces/:workspaceId/projects/:projectId/addons",
    async (request) => {
      await requireAddonManager(
        request,
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
      );
      const data = await withProjectTransaction(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          return trx("arsy_addon_definitions")
            .leftJoin(
              "arsy_addon_installations",
              "arsy_addon_installations.definition_id",
              "arsy_addon_definitions.id",
            )
            .select(
              "arsy_addon_definitions.id",
              "arsy_addon_definitions.addon_id as addonId",
              "arsy_addon_definitions.version",
              "arsy_addon_definitions.manifest",
              "arsy_addon_definitions.status",
              "arsy_addon_definitions.content_hash as contentHash",
              "arsy_addon_installations.id as installationId",
              "arsy_addon_installations.status as installationStatus",
              "arsy_addon_installations.granted_capabilities as grantedCapabilities",
              "arsy_addon_installations.configuration",
            )
            .where({
              "arsy_addon_definitions.workspace_id": request.params.workspaceId,
              "arsy_addon_definitions.project_id": request.params.projectId,
            })
            .orderBy("arsy_addon_definitions.addon_id", "asc")
            .orderBy("arsy_addon_definitions.version", "desc");
        },
      );
      return {
        data: data.map((row) => ({
          id: row.id,
          addonId: row.addonId,
          version: row.version,
          manifest: decodeAddonManifest(row.manifest),
          status: row.status,
          contentHash: row.contentHash,
          installation: row.installationId
            ? {
                id: row.installationId,
                status: row.installationStatus,
                grantedCapabilities: decodeJsonValue(row.grantedCapabilities),
                configuration: decodeJsonValue(row.configuration),
              }
            : null,
        })),
      };
    },
  );

  app.post<{ Params: RouteParams; Body: unknown }>(
    "/workspaces/:workspaceId/projects/:projectId/addons",
    { schema: { body: addonManifestBodySchema } },
    async (request, reply) => {
      const knex = getKnex(app);
      const actor = await requireAddonManager(
        request,
        knex,
        request.params.workspaceId,
        request.params.projectId,
      );
      const manifest = validateAddonManifest(request.body);
      const definitionId = randomUUID();
      const now = new Date();
      const contentHash = addonManifestHash(manifest);

      await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          const existing = await trx("arsy_addon_definitions")
            .select("id")
            .where({
              project_id: request.params.projectId,
              addon_id: manifest.id,
              version: manifest.version,
            })
            .first();
          if (existing) {
            throw new HttpError(409, "This add-on version already exists in the project.");
          }
          try {
            await trx("arsy_addon_definitions").insert({
              id: definitionId,
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              addon_id: manifest.id,
              version: manifest.version,
              manifest: JSON.stringify(manifest),
              content_hash: contentHash,
              status: "draft",
              created_by: actor.accountId,
              created_at: now,
            });
          } catch (error) {
            if (
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              error.code === "23505"
            ) {
              throw new HttpError(409, "This add-on version already exists in the project.");
            }
            throw error;
          }
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: actor.accountId,
            action: "addon.draft_created",
            resourceType: "addon",
            resourceId: definitionId,
            metadata: { addonId: manifest.id, version: manifest.version },
          });
        },
      );

      return reply.code(201).send({
        id: definitionId,
        addonId: manifest.id,
        version: manifest.version,
        status: "draft",
        contentHash,
        manifest,
        createdAt: now.toISOString(),
      });
    },
  );

  app.post<{ Params: RouteParams }>(
    "/workspaces/:workspaceId/projects/:projectId/addons/:addonId/:version/validate",
    async (request) => {
      const knex = getKnex(app);
      const actor = await requireAddonManager(
        request,
        knex,
        request.params.workspaceId,
        request.params.projectId,
      );

      return withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          const definition = await requireDefinition(
            trx,
            request.params.workspaceId,
            request.params.projectId,
            request.params.addonId,
            request.params.version,
          );
          await validateUiModelReferences(
            trx,
            request.params.projectId,
            definition.manifest,
          );
          if (definition.status === "installed") {
            throw new HttpError(409, "An installed add-on definition is immutable.");
          }
          await trx("arsy_addon_definitions")
            .where({ id: definition.id })
            .update({ status: "validated" });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: actor.accountId,
            action: "addon.validated",
            resourceType: "addon",
            resourceId: definition.id,
            metadata: { addonId: definition.manifest.id, version: definition.manifest.version },
          });
          return {
            id: definition.id,
            addonId: definition.manifest.id,
            version: definition.manifest.version,
            status: "validated",
            contentHash: addonManifestHash(definition.manifest),
            requestedCapabilities: definition.manifest.capabilities,
            uiPages: definition.manifest.ui ?? [],
          };
        },
      );
    },
  );

  app.post<{ Params: RouteParams; Body: InstallBody }>(
    "/workspaces/:workspaceId/projects/:projectId/addons/:addonId/:version/install",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["grantedCapabilities", "configuration"],
          properties: {
            grantedCapabilities: {
              type: "array",
              maxItems: 2,
              uniqueItems: true,
              items: { type: "string", enum: ["models.read", "records.read"] },
            },
            configuration: { type: "object", additionalProperties: true },
          },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const actor = await requireAddonManager(
        request,
        knex,
        request.params.workspaceId,
        request.params.projectId,
      );

      return withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          await requireProject(trx, request.params.workspaceId, request.params.projectId);
          const definition = await requireDefinition(
            trx,
            request.params.workspaceId,
            request.params.projectId,
            request.params.addonId,
            request.params.version,
          );
          if (
            request.body.grantedCapabilities.some(
              (capability) => !definition.manifest.capabilities.includes(capability),
            )
          ) {
            throw new HttpError(
              400,
              "An add-on grant must be explicitly requested by its manifest.",
            );
          }
          const configuration = validateAddonConfiguration(
            definition.manifest,
            request.body.configuration,
          );
          const existing = await trx("arsy_addon_installations")
            .select("id", "status", "granted_capabilities as grantedCapabilities", "configuration")
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              definition_id: definition.id,
            })
            .first();
          if (existing) {
            const sameGrants =
              canonicalJson(decodeJsonValue(existing.grantedCapabilities)) ===
              canonicalJson(request.body.grantedCapabilities);
            const sameConfiguration =
              canonicalJson(decodeJsonValue(existing.configuration)) ===
              canonicalJson(configuration);
            if (!sameGrants || !sameConfiguration) {
              throw new HttpError(
                409,
                "The add-on is already installed. Update its configuration or grants instead.",
              );
            }
            return reply.code(200).send({
              id: existing.id,
              status: existing.status,
              grantedCapabilities: decodeJsonValue(existing.grantedCapabilities),
              configuration: decodeJsonValue(existing.configuration),
            });
          }
          if (definition.status !== "validated") {
            throw new HttpError(409, "Only a validated add-on can be installed.");
          }
          await validateUiModelReferences(
            trx,
            request.params.projectId,
            definition.manifest,
          );
          await requireEnabledDependencies(
            trx,
            request.params.workspaceId,
            request.params.projectId,
            definition.manifest,
          );

          const installationId = randomUUID();
          const now = new Date();
          await trx("arsy_addon_installations").insert({
            id: installationId,
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
            definition_id: definition.id,
            granted_capabilities: JSON.stringify(request.body.grantedCapabilities),
            configuration: JSON.stringify(configuration),
            status: "installed",
            updated_by: actor.accountId,
            created_at: now,
            updated_at: now,
          });
          await trx("arsy_addon_definitions")
            .where({ id: definition.id })
            .update({ status: "installed" });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: actor.accountId,
            action: "addon.installed",
            resourceType: "addon_installation",
            resourceId: installationId,
            metadata: {
              addonId: definition.manifest.id,
              version: definition.manifest.version,
              grantedCapabilities: request.body.grantedCapabilities,
            },
          });

          return reply.code(201).send({
            id: installationId,
            status: "installed",
            grantedCapabilities: request.body.grantedCapabilities,
            configuration,
            createdAt: now.toISOString(),
          });
        },
      );
    },
  );

  app.patch<{
    Params: RouteParams;
    Body: { configuration: Record<string, unknown>; grantedCapabilities: string[] };
  }>(
    "/workspaces/:workspaceId/projects/:projectId/addons/installations/:installationId",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["configuration", "grantedCapabilities"],
          properties: {
            configuration: { type: "object", additionalProperties: true },
            grantedCapabilities: {
              type: "array",
              maxItems: 2,
              uniqueItems: true,
              items: { type: "string", enum: ["models.read", "records.read"] },
            },
          },
        },
      },
    },
    async (request) => {
      const knex = getKnex(app);
      const actor = await requireAddonManager(
        request,
        knex,
        request.params.workspaceId,
        request.params.projectId,
      );
      return withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          const installation = await trx("arsy_addon_installations")
            .select("id", "definition_id as definitionId", "status")
            .where({
              id: request.params.installationId,
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
            })
            .first();
          if (!installation) {
            throw new HttpError(404, "The add-on installation was not found.");
          }
          const definitionRow = await trx("arsy_addon_definitions")
            .select("manifest", "addon_id as addonId")
            .where({ id: installation.definitionId })
            .first();
          if (!definitionRow) {
            throw new Error("An add-on installation has no definition.");
          }
          const manifest = decodeAddonManifest(definitionRow.manifest);
          if (
            request.body.grantedCapabilities.some(
              (capability) => !manifest.capabilities.includes(capability),
            )
          ) {
            throw new HttpError(
              400,
              "An add-on grant must be explicitly requested by its manifest.",
            );
          }
          const configuration = validateAddonConfiguration(
            manifest,
            request.body.configuration,
          );
          const now = new Date();
          await trx("arsy_addon_installations")
            .where({ id: installation.id })
            .update({
              granted_capabilities: JSON.stringify(request.body.grantedCapabilities),
              configuration: JSON.stringify(configuration),
              updated_by: actor.accountId,
              updated_at: now,
            });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: actor.accountId,
            action: "addon.configuration_updated",
            resourceType: "addon_installation",
            resourceId: installation.id as string,
            metadata: { addonId: definitionRow.addonId },
          });
          return {
            id: installation.id,
            status: installation.status,
            grantedCapabilities: request.body.grantedCapabilities,
            configuration,
            updatedAt: now.toISOString(),
          };
        },
      );
    },
  );

  for (const transition of [
    { action: "enable", from: ["installed", "disabled"], to: "enabled" },
    { action: "disable", from: ["enabled"], to: "disabled" },
  ] as const) {
    app.post<{ Params: RouteParams }>(
      `/workspaces/:workspaceId/projects/:projectId/addons/installations/:installationId/${transition.action}`,
      async (request) => {
        const knex = getKnex(app);
        const actor = await requireAddonManager(
          request,
          knex,
          request.params.workspaceId,
          request.params.projectId,
        );
        return withProjectTransaction(
          knex,
          request.params.workspaceId,
          request.params.projectId,
          async (trx) => {
            const installation = await trx("arsy_addon_installations")
              .select("id", "status", "definition_id as definitionId")
              .where({
                id: request.params.installationId,
                workspace_id: request.params.workspaceId,
                project_id: request.params.projectId,
              })
              .forUpdate()
              .first();
            if (!installation) {
              throw new HttpError(404, "The add-on installation was not found.");
            }
            if (installation.status === transition.to) {
              return {
                id: installation.id,
                status: transition.to,
              };
            }
            if (!(transition.from as readonly string[]).includes(installation.status as string)) {
              throw new HttpError(
                409,
                `The add-on cannot transition from "${installation.status}" to "${transition.to}".`,
              );
            }
            const definition = await trx("arsy_addon_definitions")
              .select("addon_id as addonId", "version", "manifest")
              .where({ id: installation.definitionId })
              .first();
            if (!definition) {
              throw new Error("An add-on installation has no definition.");
            }
            const manifest = decodeAddonManifest(definition.manifest);
            if (transition.action === "enable") {
              await requireEnabledDependencies(
                trx,
                request.params.workspaceId,
                request.params.projectId,
                manifest,
              );
            } else {
              await requireNoEnabledDependents(
                trx,
                request.params.workspaceId,
                request.params.projectId,
                definition.addonId as string,
                definition.version as string,
                installation.id as string,
              );
            }
            await trx("arsy_addon_installations")
              .where({ id: installation.id })
              .update({
                status: transition.to,
                updated_by: actor.accountId,
                updated_at: new Date(),
              });
            await writeAudit(trx, {
              workspaceId: request.params.workspaceId,
              projectId: request.params.projectId,
              actorId: actor.accountId,
              action: `addon.${transition.to}`,
              resourceType: "addon_installation",
              resourceId: installation.id as string,
            });
            return { id: installation.id, status: transition.to };
          },
        );
      },
    );
  }

  app.delete<{ Params: RouteParams }>(
    "/workspaces/:workspaceId/projects/:projectId/addons/installations/:installationId",
    async (request, reply) => {
      const knex = getKnex(app);
      const actor = await requireAddonManager(
        request,
        knex,
        request.params.workspaceId,
        request.params.projectId,
      );
      await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          const installation = await trx("arsy_addon_installations")
            .select("id", "status", "definition_id as definitionId")
            .where({
              id: request.params.installationId,
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
            })
            .forUpdate()
            .first();
          if (!installation) {
            throw new HttpError(404, "The add-on installation was not found.");
          }
          if (installation.status === "enabled") {
            throw new HttpError(
              409,
              "Disable the add-on before uninstalling it.",
            );
          }
          await trx("arsy_addon_installations")
            .where({ id: installation.id })
            .delete();
          await trx("arsy_addon_definitions")
            .where({ id: installation.definitionId })
            .update({ status: "validated" });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: actor.accountId,
            action: "addon.uninstalled",
            resourceType: "addon_installation",
            resourceId: installation.id as string,
          });
        },
      );
      return reply.code(204).send();
    },
  );
}
