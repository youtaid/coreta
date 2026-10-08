import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const webFiles = ["apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];
const webRoot = fileURLToPath(new URL("./apps/web/", import.meta.url));
const cnImport = {
  name: "cn",
  message: 'Import { cn } from "@/lib/utils" so custom theme tokens merge correctly.',
};
const componentDataMessage =
  "Components receive data through props; load data in the page or route handler instead.";
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
    rules: {
      "no-restricted-imports": ["error", { paths: [cnImport] }],
    },
  },
  {
    files: ["apps/web/lib/utils.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Shared components only render props; data comes from the page that uses them.
    files: ["apps/web/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [cnImport, { name: "next/headers", message: componentDataMessage }],
          patterns: [
            { group: ["@/lib/mock", "@/lib/mock/*"], message: componentDataMessage },
            { group: ["@/lib/supabase/*"], message: componentDataMessage },
          ],
        },
      ],
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
