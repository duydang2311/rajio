import base from '@repo/eslint-config/base';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
    ...base,
    svelte.configs.recommended,
    svelte.configs.prettier,
    {
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte'],
                parser: ts.parser,
                svelteConfig
            }
        }
    },
    {
        // Override or add rule settings here, such as:
        // 'svelte/button-has-type': 'error'
        rules: {}
    }
);
