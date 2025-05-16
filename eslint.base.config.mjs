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
              onlyDependOnLibsWithTags: ['type:useCases', 'type:model', 'type:di-container'],
            },
            {
              sourceTag: 'type:ports',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            {
              sourceTag: 'type:useCases',
              onlyDependOnLibsWithTags: ['type:ports', 'type:infrastructure', 'type:useCases', 'type:model', 'type:di-container'],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: ['type:ports', 'type:infrastructure', 'type:model', 'type:di-container'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            {
              sourceTag: 'type:di-container',
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
