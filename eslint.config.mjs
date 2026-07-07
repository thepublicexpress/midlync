// eslint.config.mjs
import nextVitals from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Next.js की recommended rules
  ...nextVitals,

  // आपकी कस्टम rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Files/folders को ignore करने के लिए
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "dist/**",
    ],
  },
];

export default config;