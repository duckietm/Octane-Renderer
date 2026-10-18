// @ts-check

import eslint from '@eslint/js';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json','./packages/*/tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            'indent': [
                'error',
                4,
                {
                    'SwitchCase': 1
                }
            ],
            'no-multi-spaces': [
                'error'
            ],
            'no-trailing-spaces': [
                'error',
                {
                    'skipBlankLines': false,
                    'ignoreComments': true
                }
            ],
            'linebreak-style': [
                'off'
            ],
            'quotes': [
                'error',
                'single'
            ],
            'semi': [
                'error',
                'always'
            ],
            'brace-style': [
                'error',
                'allman'
            ],
            'object-curly-spacing': [
                'error',
                'always'
            ],
            'keyword-spacing': [
                'error',
                {
                    'overrides':
                {
                    'if':
                    {
                        'after': false
                    },
                    'for':
                    {
                        'after': false
                    },
                    'while':
                    {
                        'after': false
                    },
                    'switch':
                    {
                        'after': false
                    }
                }
                }
            ],
            '@typescript-eslint/no-explicit-any': [
                'off'
            ],
            '@typescript-eslint/no-unsafe-assignment': [
                'off'
            ],
            '@typescript-eslint/no-unsafe-call': [
                'off'
            ],
            '@typescript-eslint/no-unsafe-member-access': [
                'off'
            ],
            '@typescript-eslint/no-floating-promises': [
                'off'
            ],
            '@typescript-eslint/require-await': [
                'off'
            ],
            '@typescript-eslint/no-unsafe-argument': [
                'off'
            ],
            '@typescript-eslint/no-unsafe-return': [
                'off'
            ],
            '@typescript-eslint/explicit-module-boundary-types': [
                'off',
                {
                    'allowedNames': [
                        'getMessageArray'
                    ]
                }
            ],
            '@typescript-eslint/unbound-method': [
                'off'
            ],
            '@typescript-eslint/ban-ts-comment': [
                'off'
            ],
            '@typescript-eslint/no-empty-function': [
                'error',
                {
                    'allow': [
                        'functions',
                        'arrowFunctions',
                        'generatorFunctions',
                        'methods',
                        'generatorMethods',
                        'constructors'
                    ]
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'off'
            ],
            // typescript-eslint 8 split ban-types into three rules. Keep the old intent:
            // the primitive wrappers stay banned, `Function`, `{}` and `object` stay allowed.
            '@typescript-eslint/no-wrapper-object-types': [
                'error'
            ],
            '@typescript-eslint/no-unsafe-function-type': [
                'off'
            ],
            '@typescript-eslint/no-empty-object-type': [
                'off'
            ],
            // Rules that ESLint 10 / typescript-eslint 8 turned on by default and which the
            // renderer's existing style trips: `x && x.dispose()`, empty catch blocks,
            // `String(error)` on unknown, re-thrown errors that carry the message in text,
            // and `let x = default` before a switch. They are intentional here.
            '@typescript-eslint/no-unused-expressions': [
                'error',
                {
                    'allowShortCircuit': true,
                    'allowTernary': true
                }
            ],
            'no-empty': [
                'error',
                {
                    'allowEmptyCatch': true
                }
            ],
            'no-useless-assignment': [
                'off'
            ],
            'preserve-caught-error': [
                'off'
            ],
            '@typescript-eslint/no-base-to-string': [
                'off'
            ],
            '@typescript-eslint/no-redundant-type-constituents': [
                'off'
            ]
        }
    },
);
