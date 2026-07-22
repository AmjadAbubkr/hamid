import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noPhysicalTailwind from "./eslint-rules/no-physical-tailwind.ts";

const localPlugin = {
  rules: {
    "no-physical-tailwind": noPhysicalTailwind,
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "hamid-local": localPlugin },
  },
  {
    rules: {
      "hamid-local/no-physical-tailwind": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
