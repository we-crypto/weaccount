module.exports = {
  // 默认当前目录为根目录，不再向上寻找其他的 eslint 规则
  root: true,
  // 解析器类型，这里我们检查的是 typescript 语法，因此需要使用 @typescript-eslint/parser 该解析器
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019, // 可使用 es2019 的最新规范
    sourceType: 'module', // 当前项目是 ES Module 模块
  },
  extends: [
    // 使用 @typescript-eslint/recommended 中的规则
    'plugin:@typescript-eslint/recommended',
    // 使得 @typescript-eslint 中的样式规范失效，遵循 prettier 中的样式规范
    'prettier/@typescript-eslint',
    // eslint 使用 prettier 中的样式规范，且如果使得 ESLint 检测到 prettier 的格式问题，将以 error 的形式抛出
    'plugin:prettier/recommended',
    'plugin:jsdoc/recommended',
  ],
  // 全局变量的预设，配置了 es6 和 node 中的全局变量
  env: {
    es6: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'prettier', 'jsdoc'],
  rules: {
    'prettier/prettier': 'error',
    'comma-dangle': 0,
    'no-trailing-spaces': 'off',
    'import/extensions': 0,
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'jsdoc/no-undefined-types': 'off',
    'require-jsdoc': [
      2,
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
      },
    ],
    'jsdoc/require-param-type': 0,
    'jsdoc/require-param-description': 0,
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-returns-description': 0,
    'no-console': 'error',
  },
  overrides: [
    {
      files: ['src/*/*'],
      rules: {
        'max-lines': 'off',
        'max-nested-callbacks': 'off',
        'max-statements': 'off',
      },
    },
  ],
  settings: {
    node: {
      extensions: ['.ts', '.json'],
    },
  },
};
