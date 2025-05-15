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
              sourceTag: 'type:handlers',
              onlyDependOnLibsWithTags: ['type:tokens', 'type:model', 'scope:di-container'],
            },
            {
              sourceTag: 'type:ports',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            {
              sourceTag: 'type:tokens',
              onlyDependOnLibsWithTags: ['type:ports', 'type:useCases', 'type:infrastructure', 'type:model', 'scope:di-container'],
            },
            {
              sourceTag: 'type:useCases',
              onlyDependOnLibsWithTags: ['type:ports', 'type:tokens', 'type:useCases', 'type:model', 'scope:di-container'],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: ['type:ports', 'type:tokens', 'type:infrastructure', 'type:model', 'scope:di-container'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            {
              sourceTag: 'scope:di-container',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'scope:webui',
              onlyDependOnLibsWithTags: ['scope:webui'],
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
