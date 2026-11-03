// Committed placeholder: an empty no-op. During the Amplify build,
// scripts/generate-runtime-env.mjs overwrites this module with a snapshot of
// the build-time environment (Amplify's SSR runtime starts without app env
// vars). src/instrumentation.ts applies it to process.env at server boot.
// Local development keeps using .env.local; never commit generated values.
export const runtimeEnv: Record<string, string> = {};
