#!/usr/bin/env node
// Removes every directory with one of the given names anywhere in the repository (`pnpm clear`), without descending into
// node_modules or .git: walking an installed tree visits a huge number of paths for nothing.
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../constants/src/node.mjs";

const wanted = new Set(process.argv.slice(2));
if (wanted.size === 0) {
    console.error(`clear: pass the directory names to remove, e.g. dist .turbo`);
    process.exit(2);
}

const PRUNED = new Set([`node_modules`, `.git`]);
let removed = 0;

const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        // A matched name is removed, not descended into, even if it is also a pruned one.
        if (wanted.has(entry.name)) {
            rmSync(path, { recursive: true, force: true });
            removed += 1;
            continue;
        }
        if (entry.isDirectory() && !PRUNED.has(entry.name)) {
            walk(path);
        }
    }
};

walk(repoRoot(import.meta.url));
console.log(`clear: removed ${removed}`);
