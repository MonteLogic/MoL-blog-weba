import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  // TypeScript strict type-checked config
  ...tseslint.configs.strictTypeChecked,

  // Configure parser options for type-aware linting
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },

  // Next.js plugin
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // React plugins
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Import plugin for import organization
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
    },
  },

  // Custom strict rules for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // ===== BAN 'any' USAGE =====
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // ===== STRICT TYPE CHECKS =====
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],

      // ===== SECURITY & SAFETY =====
      // Avoid console.log in production (allow warn/error for logging)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Ban non-null assertion (!) - use proper null checks instead
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Force @ts-expect-error with description instead of @ts-ignore
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': false,
          'ts-nocheck': false,
          minimumDescriptionLength: 10,
        },
      ],

      // ===== PROMISE HANDLING (Critical for async code) =====
      // Must handle or await all promises
      '@typescript-eslint/no-floating-promises': 'error',
      // Catch async functions used in wrong places
      '@typescript-eslint/no-misused-promises': 'error',
      // async functions must actually use await
      '@typescript-eslint/require-await': 'error',

      // ===== CONSISTENT CODE STYLE =====
      // Enforce type-only imports where possible
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // ===== NAMING CONVENTIONS =====
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
      ],

      // ===== FUNCTION & FILE LIMITS =====
      // Max 125 lines per function (as requested)
      'max-lines-per-function': [
        'error',
        {
          max: 125,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Max 400 lines per file
      'max-lines': [
        'warn',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      // Cyclomatic complexity limit
      complexity: ['warn', 15],
      // Max nesting depth (prevents deeply nested code)
      'max-depth': ['error', 4],
    },
  },

  // React-specific rules (JSX files)
  {
    files: ['**/*.tsx'],
    rules: {
      // Enforce key props in lists
      'react/jsx-key': 'error',
      // Catch unescaped entities
      'react/no-unescaped-entities': 'error',
      // Exhaustive deps for hooks (prevents stale closures)
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      '**/*.config.js',
      '**/*.config.mjs',
    ],
  },
);
