// @ts-check

import eslint from '@eslint/js';
import {
    defineConfig,
    globalIgnores
} from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores([
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.turbo/**',

        '**/next-env.d.ts',

        // Prisma generated files
        'apps/api/src/prisma/contract.d.ts',
        'apps/api/src/prisma/contract.json',
        'apps/api/migrations/**',

        // 各appに残っている旧ESLint config
        'apps/*/eslint.config.mjs',
    ]),

    // Web
    {
        files: ['apps/web/**/*.{js,jsx,ts,tsx}'],

        extends: [nextVitals, nextTs],

        settings: {
            next: {
                rootDir: 'apps/web/',
            },
        },

        languageOptions: {
            parserOptions: {
                tsconfigRootDir: new URL('./apps/web',
                    import.meta.url).pathname,
            },
        },
    },

    // API
    {
        files: ['apps/api/src/**/*.{js,ts}', 'apps/api/test/**/*.{js,ts}'],

        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            parserOptions: {
                projectService: true,
                tsconfigRootDir: new URL('./apps/api',
                    import.meta.url).pathname,
            },
        },

        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
        },
    },

    eslintConfigPrettier,
]);