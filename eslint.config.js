import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Exclude generated snapshots and third-party distribution/test fixtures.
  { ignores: ["dist", "memory/**", "tests/**", ".research-preview/**", ".local-deployment-manifests/**", "**/vendor/**", "wordpress/wp-content/plugins/woocommerce/**"] },
  { files: ["wordpress/wp-content/plugins/chronos-blocks/src/**/*.js"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { files: ["scripts/assistant/**/*.mjs", "verification/**/*.mjs", "src/lib/render-readiness.mjs"], ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.node } },
  { files: ["scripts/render-ready.mjs"], ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: {...globals.node, ...globals.browser} } },
  { files: ["verification/**/*.cjs"], ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: globals.node } },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
