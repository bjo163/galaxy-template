import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["apps", "packages"];
const manifests = [];

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if (entry.name === "package.json") {
      const manifest = JSON.parse(await readFile(path, "utf8"));
      manifests.push({ path, directory, manifest });
    }
  }
}

for (const root of roots) await walk(root);

const names = new Map();
const failures = [];
for (const item of manifests) {
  const name = item.manifest.name;
  if (!name) {
    failures.push(`${relative(process.cwd(), item.path)} has no package name`);
    continue;
  }
  if (names.has(name)) {
    failures.push(`duplicate workspace package name: ${name}`);
  } else {
    names.set(name, item);
  }
}

for (const item of manifests) {
  const dependencies = {
    ...item.manifest.dependencies,
    ...item.manifest.devDependencies,
    ...item.manifest.peerDependencies,
    ...item.manifest.optionalDependencies,
  };
  for (const [name, version] of Object.entries(dependencies)) {
    if (!name.startsWith("@galaxy/")) continue;
    if (!names.has(name)) {
      failures.push(`${item.manifest.name} references missing workspace package ${name}`);
      continue;
    }
    if (typeof version !== "string" || !version.startsWith("workspace:")) {
      failures.push(`${item.manifest.name} must use workspace: for internal dependency ${name}`);
    }
  }
}

if (failures.length) {
  process.stderr.write(`Workspace validation failed:\n- ${failures.join("\n- ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Validated ${manifests.length} workspace package manifests and internal dependency references.\n`);
}
