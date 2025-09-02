import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import simpleSort from 'eslint-plugin-simple-import-sort';

const rules = {
  // TypeScript-specific rules
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      minimumDescriptionLength: 9999999,
      'ts-check': false,
      'ts-expect-error': true,
      'ts-ignore': true,
      'ts-nocheck': true,
    },
  ],
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/no-redeclare': 'error',

  // General rules
  'no-redeclare': 'off',
  'no-console': 'off', // Allow console for CLI tool
  'no-unused-vars': 'off',
  'prefer-const': 'error',
  'no-var': 'error',
  'dot-notation': 'error',
  'no-unneeded-ternary': 'error',
  'no-nested-ternary': 'error',
  // 'sort-imports': 'error',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
  eqeqeq: 'error',
  curly: 'error',
  'no-warning-comments': ['warn', { terms: ['eslint-disable'], location: 'anywhere' }],
};

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleSort,
    },
    rules,
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'e2e/**/*.test.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleSort,
    },
    rules,
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  prettier, // Disable ESLint rules that conflict with Prettier
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
