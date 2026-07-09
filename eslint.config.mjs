import globals from "globals";
import pluginJs from "@eslint/js";
import pluginN from "eslint-plugin-n";

export default [
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    plugins: {
      n: pluginN,
    },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      indent: ["error", 2],
      "n/no-missing-require": "error",
    },
  },
];
