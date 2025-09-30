import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "next"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unknown-property": "off",
      "camelcase": "off",
      "require-jsdoc": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "react/jsx-key": "off",
      "@next/next/missing-suspense-with-csr-bailout": "off",
      "@typescript-eslint/no-unused-expressions": "off"
    },
  },
];

export default eslintConfig;
