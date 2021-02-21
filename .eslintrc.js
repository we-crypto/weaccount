module.exports = {
  plugins: ['@typescript-eslint', 'prettier', 'jsdoc'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:jsdoc/recommended',
  ],
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
