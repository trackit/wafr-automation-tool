import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
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
