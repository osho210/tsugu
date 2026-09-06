// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import {
    defineConfig,
    globalIgnores
} from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';

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

        // 各 app に残っている旧 ESLint config
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
        files: [
            'apps/api/src/**/*.{js,ts}',
            'apps/api/test/**/*.{js,ts}',
        ],

        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],

        plugins: {
            tsdoc,
            jsdoc,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            parserOptions: {
                projectService: true,
                tsconfigRootDir: new URL(
                    './apps/api',
                    import.meta.url,
                ).pathname,
            },
        },

        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',

            'tsdoc/syntax': 'error',
            'jsdoc/no-types': 'error',
        },
    },

    // Prisma CLI config
    {
        files: ['apps/api/prisma.config.ts'],

        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
        ],

        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    {
        files: ['apps/**/*.{ts,tsx}'],

        plugins: {
            jsdoc,
            tsdoc,
        },

        rules: {
            'tsdoc/syntax': 'error',
            'jsdoc/no-types': 'error',

            'jsdoc/require-jsdoc': [
                'error',
                {
                    publicOnly: true,
                    require: {
                        FunctionDeclaration: true,
                        ClassDeclaration: true,
                    },
                    contexts: [
                        'ExportNamedDeclaration > TSTypeAliasDeclaration',
                        'ExportNamedDeclaration > TSInterfaceDeclaration',
                        'ExportNamedDeclaration > TSEnumDeclaration',
                        'ExportNamedDeclaration > VariableDeclaration',
                    ],
                },
            ],

            'jsdoc/require-description': [
                'error',
                {
                    contexts: [
                        'ExportNamedDeclaration > TSTypeAliasDeclaration',
                        'ExportNamedDeclaration > TSInterfaceDeclaration',
                        'ExportNamedDeclaration > TSEnumDeclaration',
                        'ExportNamedDeclaration > VariableDeclaration',
                        'ExportNamedDeclaration > FunctionDeclaration',
                        'ExportDefaultDeclaration > FunctionDeclaration',
                        'ExportNamedDeclaration > ClassDeclaration',
                        'ExportDefaultDeclaration > ClassDeclaration',
                    ],
                },
            ],
        },
    },

    // Prettierとの競合ルールを無効化
    eslintConfigPrettier,

    // Web / API 共通の強制ルール
    {
        files: ['apps/**/*.{js,jsx,ts,tsx}'],

        plugins: {
            '@stylistic': stylistic,
            'simple-import-sort': simpleImportSort,
        },

        rules: {
            '@stylistic/eol-last': ['error', 'always'],
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
        },
    },
]);