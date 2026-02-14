import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
        js.configs.recommended,
        prettier,
        ...tseslint.configs.recommended,

        {
                files: ['**/*.{js,jsx,ts,tsx}'],
                languageOptions: {
                        ecmaVersion: 2023,
                        sourceType: 'module'
                },
                rules: {
                        curly: 'off', // <-- autorise: if (cond) instruction;
                        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
                        indent: ['error', 8],
                        'key-spacing': ['error', { align: 'value' }],
                        'space-in-parens': ['error', 'never'],
                        'arrow-parens': ['error', 'always'],
                        'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }]
                }
        }
];
