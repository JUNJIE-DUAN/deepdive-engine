module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js", "dist", "node_modules"],
  rules: {
    // TypeScript规则
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",

    // 类型安全 - 核心规则保持error
    "@typescript-eslint/no-explicit-any": "warn", // 降级为warn，允许合理使用any
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",

    // Unsafe操作 - 降级为warn（MongoDB/Neo4j等场景需要）
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",

    // 其他规则调整
    "@typescript-eslint/restrict-template-expressions": "warn",
    "@typescript-eslint/require-await": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",

    // 代码质量
    "no-console": [
      "warn",
      {
        allow: ["warn", "error", "info"],
      },
    ],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",

    // NestJS特定规则
    "@typescript-eslint/no-inferrable-types": "off",
  },
};
