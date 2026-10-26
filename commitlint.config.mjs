// Conventional Commits, checked by .githooks/commit-msg (the root `prepare` script sets `core.hooksPath`). Plain JS on
// purpose: commitlint loads a .ts config through the TypeScript compiler API, which TypeScript 7's native compiler lacks.
/** @type {import("@commitlint/types").UserConfig} */
export default {
    extends: [`@commitlint/config-conventional`],
    rules: {
        "type-enum": [2, `always`, [`feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`, `revert`]],
        // No ceiling on the body or trailers: a trailer line is prose, not a terminal line. The subject stays bounded.
        "body-max-line-length": [0],
        "footer-max-line-length": [0],
        // Drops `sentence-case` only, so a subject may open with a code identifier (`StatusBadge`, `OAuth`). Title Case,
        // PascalCase and shouted subjects are still refused.
        "subject-case": [2, `never`, [`start-case`, `pascal-case`, `upper-case`]],
    },
};
