import type { DataSourceOptions } from 'typeorm';

import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { tokenSecretsManager } from '../../infrastructure';
import { entities, tenantsEntities } from './entities';

export type TypeORMConfig = { type: 'postgres' } & DataSourceOptions;

export type TestTypeORMConfigParameters = Partial<{
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  migrations: string[];
}>;

export const defaultTypeORMConfig: TypeORMConfig = {
  type: 'postgres',
  port: 5432,
  host: process.env.DB_HOST,
  database: 'postgres',
  entities,
  migrations: ['./migrations/*.js'], // In production, we use the compiled js files
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

export function getTestTypeORMConfig(
  params: TestTypeORMConfigParameters = {},
): TypeORMConfig {
  const host = params.host ?? process.env.DB_HOST ?? '127.0.0.1';
  const port = params.port ?? 5432;
  const username = params.username ?? process.env.DB_USERNAME;
  const password = params.password ?? process.env.DB_PASSWORD;
  const synchronize = params.synchronize ?? true;
  const logging = params.logging ?? true;
  const migrations = params.migrations ?? [];

  return {
    ...defaultTypeORMConfig,
    host,
    port,
    username,
    password,
    synchronize,
    logging,
    migrations,
  };
}

export const tokenTypeORMConfigCreator = createInjectionToken<
  () => Promise<TypeORMConfig>
>('TypeORMConfig', {
  useFactory: () => {
    return async () => {
      const secretsManager = inject(tokenSecretsManager);
      const credentialsSecretValue =
        await secretsManager.getDatabaseCredentialsSecret(
          inject(tokenDBCredentialsSecretArn),
        );
      return {
        ...defaultTypeORMConfig,
        ...credentialsSecretValue,
      };
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
