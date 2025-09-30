module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["plugin:react/recommended", "google", "prettier", "plugin:@next/next/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "react/prop-types": "off",
    "no-unused-vars": "off",
    "react/no-unknown-property": "off",
    "camelcase": "off",
    "require-jsdoc": "off",
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off",
    "react/jsx-key": "off",
    "@next/next/missing-suspense-with-csr-bailout": "off",
    "@typescript-eslint/no-unused-expressions": "off"
  },
};