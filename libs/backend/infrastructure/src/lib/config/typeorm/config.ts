import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { DataSourceOptions } from 'typeorm';

import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { tokenSecretsManager } from '../../infrastructure';
import { entities, tenantsEntities } from './entities';

export type TypeORMConfig = { type: 'postgres' } & DataSourceOptions;

export const defaultTypeORMConfig: TypeORMConfig = {
  type: 'postgres',
  port: 5432,
  host: process.env.DB_HOST,
  database: 'postgres',
  entities,
  migrations: ['./migrations/*.js'], // In production, we use the compiled js files
};

export const testTypeORMConfig: TypeORMConfig = {
  ...defaultTypeORMConfig,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: '127.0.0.1',
  synchronize: true,
  logging: true,
  migrations: [],
};

export const tenantsTypeORMConfig: Pick<
  TypeORMConfig,
  'database' | 'entities' | 'migrations'
> = {
  database: 'postgres',
  entities: tenantsEntities,
  migrations: ['./tenantsMigrations/*.js'], // In production, we use the compiled js files
};

export const testTenantsTypeORMConfig: TypeORMConfig = {
  type: 'postgres',
  ...tenantsTypeORMConfig,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: '127.0.0.1',
  synchronize: true,
  logging: true,
  migrations: [],
};

export async function startPostgresContainer(
  port = 5432,
  image = 'postgres:15-alpine',
) {
  const container = new PostgreSqlContainer(image)
    .withDatabase('postgres')
    .withUsername(process.env.DB_USERNAME ?? 'postgres')
    .withPassword(process.env.DB_PASSWORD ?? 'postgres')
    .withExposedPorts(port)
    .withHealthCheck({
      test: ['CMD-SHELL', 'pg_isready -d postgres'],
      interval: 3000,
      timeout: 5000,
      retries: 5,
    });
  const startedContainer = await container.start();

  process.env.DB_HOST = startedContainer.getHost();
  process.env.DB_PORT = startedContainer.getMappedPort(port).toString();
  return startedContainer;
}

export const tokenTypeORMConfigCreator = createInjectionToken<
  Promise<TypeORMConfig>
>('TypeORMConfig', {
  useFactory: async () => {
    const secretsManager = inject(tokenSecretsManager);
    const credentialsSecretValue =
      await secretsManager.getDatabaseCredentialsSecret(
        inject(tokenDBCredentialsSecretArn),
      );
    return {
      ...defaultTypeORMConfig,
      ...credentialsSecretValue,
    };
  },
});

export const tokenDBCredentialsSecretArn = createInjectionToken<string>(
  'DBCredentialsSecretArn',
  {
    useFactory: () => {
      const arn = process.env.DB_CREDENTIALS_SECRET_ARN;
      assertIsDefined(arn, 'DB_CREDENTIALS_SECRET_ARN is not defined');
      return arn;
    },
  },
);
