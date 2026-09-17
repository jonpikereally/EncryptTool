#!/usr/bin/env node
/** Minimal pre-deploy check: every shipped script must parse. */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  ...readdirSync(join(root, "public"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => join("public", name)),
  "src/index.js",
];

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
    console.log(`ok   ${file}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${file}\n${error.stderr?.toString() ?? error.message}`);
  }
}

process.exit(failed ? 1 : 0);
