#!/usr/bin/env node
// Runs as the root `prepare` script on every install (a developer clone, CI, a Docker build with no `.git`), so it is
// plain JS importing nothing installed. Nothing here fails an install: a missing piece is a warning.
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../constants/src/node.mjs";

const root = repoRoot(import.meta.url);

// The root .env every local process reads (the api's config, Prisma's CLI, docker compose), seeded once from the
// committed example and never overwritten.
const env = join(root, `.env`);
const example = join(root, `.env.example`);
if (!existsSync(env) && existsSync(example)) {
    copyFileSync(example, env);
    console.log(`prepare: created .env from .env.example`);
}

const git = (...args) => execFileSync(`git`, args, { cwd: root, stdio: `ignore` });

try {
    git(`rev-parse`, `--git-dir`);
} catch {
    // No git repository (a Docker build, an exported tree) has no hooks to point at.
    process.exit(0);
}

try {
    git(`config`, `core.hooksPath`, `.githooks`);
} catch (error) {
    console.warn(`prepare: git hooks not configured (${error.message}): commits still work, they just skip the message check`);
}

// Re-arms each hook's executable bit: a checkout or patch can leave a file's mode alone, and git silently skips a
// non-executable hook. chmod is a no-op on Windows.
for (const hook of readdirSync(join(root, `.githooks`))) {
    chmodSync(join(root, `.githooks`, hook), 0o755);
}
