// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Repo-wide flat config (ESLint 9). Lint runs from the root over all packages.
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/generated/**',
      '**/node_modules/**',
      '**/*.config.{js,cjs,mjs,ts}',
      '**/*.cjs',
      '**/vite.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
);
