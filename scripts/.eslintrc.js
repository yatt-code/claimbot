module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
};