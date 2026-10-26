import pino from "pino";
import pretty from "pino-pretty";
import type { Config } from "./env.config.js";

// ISO timestamps, `message` as the message key, the standard `err` serializer, and `redact` so common secret fields never
// reach the output even when a handler logs a raw header or body (defence in depth beside mask() on the config).
const options: pino.LoggerOptions = {
    base: { pid: process.pid },
    messageKey: `message`,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label: string) => ({ level: label }),
    },
    serializers: {
        err: pino.stdSerializers.err,
    },
    redact: {
        paths: [`*.authorization`, `*.cookie`, `*.password`, `*.token`, `*.secret`],
        censor: `[REDACTED]`,
    },
};

// Development: colorized lines through an in-process pino-pretty stream (no worker thread, so it is reliable under Bun).
// Production: one JSON object per line on stdout, for a log collector.
export const createLogger = (config: Config): pino.Logger => {
    const withLevel: pino.LoggerOptions = { ...options, level: config.log.level };
    return config.log.pretty
        ? pino(withLevel, pretty({ colorize: true, messageKey: `message`, translateTime: `SYS:HH:MM:ss`, ignore: `pid,hostname` }))
        : pino(withLevel);
};
