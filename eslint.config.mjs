import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Tenant-isolation guard: direct DB imports allowed only inside the
  // repository layer (src/shared/db/** and src/modules/**/lib/*repo.ts).
  // Anywhere else must go through a repo so tenantId filtering is enforced.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/shared/db/client", "@/shared/db/schema"],
              message:
                "Direct DB imports are restricted to the repository layer. Use a repo from @/shared/db/*-repo or @/modules/*/lib/*-repo instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/shared/db/**/*.{ts,tsx}",
      "src/modules/**/lib/*repo.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
