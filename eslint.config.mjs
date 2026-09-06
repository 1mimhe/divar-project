// ESLint flat config (ESLint 9). Run `npm install` then `npm run lint`.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/", "coverage/", "node_modules/", "public/assets/"],
  },
);
