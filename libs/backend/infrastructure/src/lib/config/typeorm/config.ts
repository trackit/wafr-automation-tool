import path from 'path';
import type { DataSourceOptions } from 'typeorm';
import z from 'zod';

import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined, parseJsonObject } from '@shared/utils';

import { tokenSecretsManager } from '../../SecretsManager';
import { entities } from './entities';

export type TypeORMConfig = { type: 'postgres' } & DataSourceOptions;

export const defaultTypeORMConfig: TypeORMConfig = {
  type: 'postgres',
  port: 5432,
  host: process.env.DB_HOST,
  database: 'postgres',
  entities,
  migrations: [path.join(__dirname, 'migrations/*.js')], // In production, we use the compiled js files
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

interface DBCredentials {
  username: string;
  password: string;
}
const DBCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
}) satisfies z.ZodType<DBCredentials>;

export const tokenTypeORMConfigCreator = createInjectionToken<
  Promise<TypeORMConfig>
>('TypeORMConfig', {
  useFactory: async () => {
    const secretsManager = inject(tokenSecretsManager);
    const credentialsSecretValue = await secretsManager.getSecretValue(
      inject(tokenDBCredentialsSecretArn)
    );
    const dbCredentials = DBCredentialsSchema.parse(
      parseJsonObject(credentialsSecretValue)
    );
    return {
      ...defaultTypeORMConfig,
      username: dbCredentials.username,
      password: dbCredentials.password,
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
  }
);
