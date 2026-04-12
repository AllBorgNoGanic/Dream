import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  // Ignore build output and dependencies
  { ignores: ["dist/**", "node_modules/**", "android/**", "ios/**"] },

  // ── Browser code (src/) ──────────────────────────────────
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 19 JSX transform - no need to import React
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // Practical defaults
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-useless-assignment": "warn",
      "react/prop-types": "off",
      // Data fetching in useEffect is a standard React pattern
      "react-hooks/set-state-in-effect": "off",
    },
    settings: { react: { version: "detect" } },
  },

  // ── Node code (api/, config files) ──────────────────────
  {
    files: ["api/**/*.js", "*.config.js", "capacitor.config.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
