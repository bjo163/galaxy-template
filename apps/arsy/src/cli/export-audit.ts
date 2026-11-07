import { createHash } from "node:crypto";
import { createDatabase } from "@galaxy/database";

import { loadConfig } from "../config/env.js";
import { withProjectTransaction } from "../core/tenancy/database-context.js";

function readArguments(args: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key?.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values[key.slice(2)] = value;
    index += 1;
  }
  return values;
}

const args = readArguments(process.argv.slice(2));
const workspaceId = args["workspace-id"];
const projectId = args["project-id"];
const since = args.since ? new Date(args.since) : new Date(0);
const before = args.before ? new Date(args.before) : new Date();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!workspaceId || !uuidPattern.test(workspaceId)) throw new Error("--workspace-id must be a UUID");
if (!projectId || !uuidPattern.test(projectId)) throw new Error("--project-id must be a UUID");
if (Number.isNaN(since.getTime()) || Number.isNaN(before.getTime()) || since >= before) {
  throw new Error("--since and --before must define a valid increasing time range");
}

const database = await createDatabase(loadConfig().database);
const digest = createHash("sha256");
const batchSize = 500;
let count = 0;
let lastCreatedAt: Date | undefined;
let lastId: string | undefined;

try {
  while (true) {
    const rows = await withProjectTransaction(
      database.knex,
      workspaceId,
      projectId,
      async (trx) => {
        const query = trx("arsy_audit_events")
          .select(
            "id",
            "workspace_id as workspaceId",
            "project_id as projectId",
            "actor_id as actorId",
            "action",
            "resource_type as resourceType",
            "resource_id as resourceId",
            "metadata",
            "created_at as createdAt",
          )
          .where({ workspace_id: workspaceId, project_id: projectId })
          .andWhere("created_at", ">=", since)
          .andWhere("created_at", "<", before)
          .orderBy("created_at", "asc")
          .orderBy("id", "asc")
          .limit(batchSize);
        if (lastCreatedAt && lastId) {
          query.andWhereRaw("(created_at, id) > (?, ?)", [lastCreatedAt, lastId]);
        }
        return query;
      },
    );
    for (const row of rows) {
      const line = JSON.stringify({
        id: row.id,
        workspaceId: row.workspaceId,
        projectId: row.projectId,
        actorId: row.actorId,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        metadata: row.metadata,
        createdAt: new Date(row.createdAt as string).toISOString(),
      }) + "\n";
      process.stdout.write(line);
      digest.update(line);
      count += 1;
    }
    if (rows.length < batchSize) break;
    const last = rows.at(-1);
    lastCreatedAt = new Date(last?.createdAt as string);
    lastId = last?.id as string;
  }

  const manifest = {
    formatVersion: 1,
    workspaceId,
    projectId,
    since: since.toISOString(),
    before: before.toISOString(),
    eventCount: count,
    sha256: digest.digest("hex"),
    exportedAt: new Date().toISOString(),
    tool: "arsy-audit-export/1",
  };
  process.stderr.write(JSON.stringify(manifest) + "\n");
} finally {
  await database.close();
}
