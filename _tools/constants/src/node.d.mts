/** Where the caller is: `import.meta.url`, `import.meta.dirname`, or any path. */
type Origin = string;

/** The monorepo root above `from`: the nearest directory holding `pnpm-workspace.yaml`. Throws where there is none. */
export declare const repoRoot: (from: Origin) => string;
