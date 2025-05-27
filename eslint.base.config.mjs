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
                'type:useCases',
                'type:models',
                'type:infrastructure',
                'scope:shared',
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
              sourceTag: 'type:ports',
              onlyDependOnLibsWithTags: ['type:models', 'scope:shared'],
            },
            {
              sourceTag: 'type:useCases',
              onlyDependOnLibsWithTags: [
                'type:ports',
                'type:infrastructure',
                'type:useCases',
                'type:models',
                'type:di-container',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: [
                'type:ports',
                'type:infrastructure',
                'type:models',
                'type:di-container',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'type:models',
              onlyDependOnLibsWithTags: ['type:models', 'scope:shared'],
            },
            {
              sourceTag: 'type:di-container',
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
