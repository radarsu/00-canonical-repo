// A deep copy of `value` with the given dotted paths replaced by "***", so the loaded config is safe to log. An unset or
// empty secret stays as it is: seeing that it is missing is the point of logging it.
export const mask = <T>(value: T, secretPaths: readonly string[]): T => {
    const clone = structuredClone(value) as Record<string, unknown>;
    for (const path of secretPaths) {
        const segments = path.split(`.`);
        const leaf = segments.pop();
        let cursor: Record<string, unknown> | undefined = clone;
        for (const segment of segments) {
            const next: unknown = cursor?.[segment];
            cursor = typeof next === `object` && next !== null ? (next as Record<string, unknown>) : undefined;
        }
        if (cursor !== undefined && leaf !== undefined && cursor[leaf] !== undefined && cursor[leaf] !== ``) {
            cursor[leaf] = `***`;
        }
    }
    return clone as T;
};
