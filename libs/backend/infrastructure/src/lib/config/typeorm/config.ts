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
