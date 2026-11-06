import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [archivePath, manifestPath] = process.argv.slice(2);
if (!archivePath || !manifestPath) {
  throw new Error("Usage: node .scripts/verify-audit-archive.mjs <events.ndjson> <manifest.json>");
}
const [archive, manifestText] = await Promise.all([
  readFile(archivePath),
  readFile(manifestPath, "utf8"),
]);
const manifest = JSON.parse(manifestText);
const digest = createHash("sha256").update(archive).digest("hex");
const lines = archive.length === 0 ? [] : archive.toString("utf8").trimEnd().split("\n");
if (manifest.formatVersion !== 1) throw new Error("Unsupported audit archive format version");
if (manifest.sha256 !== digest) throw new Error("Audit archive SHA-256 digest mismatch");
if (manifest.eventCount !== lines.length) throw new Error("Audit archive event count mismatch");
for (const line of lines) JSON.parse(line);
process.stdout.write(JSON.stringify({
  valid: true,
  eventCount: lines.length,
  sha256: digest,
  workspaceId: manifest.workspaceId,
  projectId: manifest.projectId,
}) + "\n");
