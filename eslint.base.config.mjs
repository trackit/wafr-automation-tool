import nx from '@nx/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginImport from 'eslint-plugin-import';
import pluginPromise from 'eslint-plugin-promise';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  { ignores: ['**/dist'] },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      promise: pluginPromise,
      'simple-import-sort': simpleImportSort,
      import: pluginImport,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: [
                'scope:backend',
                'type:backend-useCases',
                'type:backend-models',
                'type:backend-infrastructure',
                'scope:shared',
                'type:backend-errors',
              ],
            },
            {
              sourceTag: 'scope:webui',
              onlyDependOnLibsWithTags: [
                'scope:webui',
                'scope:shared',
                'scope:webui-libs',
              ],
            },
            {
              sourceTag: 'scope:webui-libs',
              onlyDependOnLibsWithTags: ['scope:webui-libs', 'scope:shared'],
            },
            {
              sourceTag: 'type:backend-ports',
              onlyDependOnLibsWithTags: ['type:backend-models', 'scope:shared'],
            },
            {
              sourceTag: 'type:backend-useCases',
              onlyDependOnLibsWithTags: [
                'type:backend-ports',
                'type:backend-infrastructure',
                'type:backend-useCases',
                'type:backend-models',
                'type:di-container',
                'scope:shared',
                'type:backend-errors',
              ],
            },
            {
              sourceTag: 'type:backend-infrastructure',
              onlyDependOnLibsWithTags: [
                'type:backend-ports',
                'type:backend-infrastructure',
                'type:backend-models',
                'type:di-container',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'type:backend-models',
              onlyDependOnLibsWithTags: ['type:backend-models', 'scope:shared'],
            },
            { sourceTag: 'type:di-container', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'type:backend-errors', onlyDependOnLibsWithTags: [] },
          ],
        },
      ],

      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:', '^(?!@(?:backend|webui|shared)(?:/|$))@?\\w'],
            ['^(?:@backend|@webui|@shared)(?:/|$)'],
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import/no-duplicates': 'error',
      'import/order': 'off',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 1, maxEOF: 0 }],

      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true, ignoreIIFE: false },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false, attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',
      'no-void': ['error', { allowAsStatement: true }],
      'promise/no-return-wrap': 'error',
      'promise/valid-params': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
