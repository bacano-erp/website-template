import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      // The agent skills are installed from @bacano/sdk and updated with
      // `pnpm sdk:update`; they are not this repository's code.
      ".agents/**",
      ".claude/**",
      ".codex/**",
    ],
  },
];

export default eslintConfig;
