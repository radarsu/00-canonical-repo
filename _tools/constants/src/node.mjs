import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Finds the monorepo root by walking up to a marker, never by counting `../..`, which breaks silently whenever a file moves. Plain
// .mjs so scripts can import it before install or build; kept off any browser entry (it reads the filesystem).

// Root marker: not package.json (every package has one) and not .git (absent in a worktree's parents, present in others).
const REPO_MARKER = "pnpm-workspace.yaml";

// The caller's directory from a file:// URL, import.meta.dirname or a bare path.
const startDir = (from) => {
    const path = from.startsWith("file:") ? fileURLToPath(from) : resolve(from);
    return statSync(path, { throwIfNoEntry: false })?.isDirectory() === false ? dirname(path) : path;
};

const walkUp = (dir, marker) => {
    let current = dir;
    for (;;) {
        if (existsSync(resolve(current, marker))) {
            return current;
        }
        const parent = dirname(current);
        if (parent === current) {
            return undefined;
        }
        current = parent;
    }
};

// The monorepo root above `from`: a checkout's, or a pruned `pnpm deploy` tree's (which writes its own workspace file).
// Throws where there is none rather than resolving to a confidently wrong directory.
export const repoRoot = (from) => {
    const found = walkUp(startDir(from), REPO_MARKER);
    if (found === undefined) {
        throw new Error(`repoRoot: no ${REPO_MARKER} above ${startDir(from)}, is this a complete checkout?`);
    }
    return found;
};
