import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const env = { ...process.env };

if (!env.APP_BUILD_VERSION) {
  const commitSha = env.VERCEL_GIT_COMMIT_SHA?.trim();
  const packageVersion =
    typeof packageJson.version === "string" ? packageJson.version.trim() : "";

  env.APP_BUILD_VERSION = commitSha || packageVersion || "unknown";
}

if (!env.BUILD_TIMESTAMP) {
  env.BUILD_TIMESTAMP = new Date().toISOString();
}

const nextBin = path.join(repoRoot, "node_modules", ".bin", "next");
const result = spawnSync(nextBin, ["build"], {
  cwd: repoRoot,
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
