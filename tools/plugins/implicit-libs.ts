import { CreateNodesV2 } from '@nx/devkit';

export const createNodesV2: CreateNodesV2 = [
  /* This will look for all `index.ts` files that follow your file structure convention. */
  'libs/*/*/*/index.ts',
  (indexPathList) => {
    return indexPathList.map((indexPath) => {
      const [libs, scope, type, _] = indexPath.split('/');
      const projectRoot = `${libs}/${scope}/${type}`;
      const projectName = `${scope}-${type}`;

      return [
        /* This is used by Nx to track which matching file was used by the plugin
         * It is shown in the project detail web view. */
        indexPath,
        {
          projects: {
            /* This will add a project to the Nx graph for the detected library. */
            [projectRoot]: {
              name: projectName,
              sourceRoot: projectRoot,
              projectType: 'library',
              tags: [`type:${type}`, `scope:${scope}`],
              targets: {
                lint: {
                  command: 'eslint .',
                  options: {
                    cwd: projectRoot,
                  },
                  cache: true,
                  inputs: [
                    'default',
                    '^default',
                    `{workspaceRoot}/${libs}/${scope}/eslint.config.mjs`,
                    '{workspaceRoot}/tools/eslint-rules/**/*',
                    {
                      externalDependencies: ['eslint'],
                    },
                  ],
                  outputs: ['{options.outputFile}'],
                },
                test: {
                  command: 'vitest',
                  options: {
                    cwd: projectRoot,
                    root: '.',
                  },
                  cache: true,
                  inputs: [
                    'default',
                    '^production',
                    {
                      externalDependencies: ['vitest'],
                    },
                    {
                      env: 'CI',
                    },
                  ],
                  outputs: [
                    `{workspaceRoot}/coverage/${libs}/${scope}/${type}`,
                  ],
                },
              },
            },
          },
        },
      ];
    });
  },
];
