import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Temporarily relax some rules to minimize build-blocking errors.
      // These should be progressively fixed and re-enabled.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { "argsIgnorePattern": "^_" }],
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
