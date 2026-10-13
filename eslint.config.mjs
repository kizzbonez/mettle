import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Size budgets keep files single-purpose: 200 lines per file, 40 per function.
// Components get 80, because JSX is long without being complicated.
const budget = { skipBlankLines: true, skipComments: true };

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/migrations/**',
      'apps/web/public/**',
      'apps/web/next-env.d.ts',
      'content/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'max-lines': ['error', { max: 200, ...budget }],
      'max-lines-per-function': ['error', { max: 40, IIFEs: true, ...budget }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: { 'max-lines-per-function': ['error', { max: 80, IIFEs: true, ...budget }] },
  },
  {
    // A `describe` block is a list of cases, not one function.
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**', 'e2e/**', 'scripts/**'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': ['error', { max: 300, ...budget }],
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
