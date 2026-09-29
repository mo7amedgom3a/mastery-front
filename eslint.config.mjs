import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  // eslint-plugin-react's version auto-detection calls an API removed in ESLint 10; pin it instead.
  { settings: { react: { version: "19.2" } } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
