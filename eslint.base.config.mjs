import nx from '@nx/eslint-plugin';
import pluginImport from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: pluginImport,
      'unused-imports': unusedImports,
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
            {
              sourceTag: 'type:di-container',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'type:backend-errors',
              onlyDependOnLibsWithTags: [],
            },
          ],
        },
      ],
      'simple-import-sort/imports': ['error', {
        groups: [
          ['^\\u0000'],
          ['^node:', '^(?!@(?:backend|webui|shared)(?:/|$))@?\\w'],
          ['^(?:@backend|@webui|@shared)(?:/|$)'],
          ['^\\.'],
        ],
      }],
      'simple-import-sort/exports': 'error',
      'import/no-duplicates': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 1, maxEOF: 0 }],
      'import/order': 'off',
      'unused-imports/no-unused-imports': 'error',
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
    // Override or add rules here
    rules: {},
  },
];
