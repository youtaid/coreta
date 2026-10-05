import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const webFiles = ["apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];
const webRoot = fileURLToPath(new URL("./apps/web/", import.meta.url));
const scopedNextVitals = nextVitals
  .filter((config) => !("ignores" in config))
  .map((config) => ({ ...config, files: webFiles }));

export default defineConfig([
  ...nextTs,
  ...scopedNextVitals,
  {
    files: webFiles,
    settings: {
      next: {
        rootDir: webRoot,
      },
    },
  },
  prettier,
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/coverage/**",
    "**/next-env.d.ts",
  ]),
]);
