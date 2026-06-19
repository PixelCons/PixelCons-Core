import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['node_modules/**', 'contracts/**', 'public/**', '.next/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'test/**/*.{js,jsx,ts,tsx}', 'scripts/**/*.{js,jsx,ts,tsx}', 'archive/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.mocha,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', {caughtErrors: 'none'}],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
