import path from 'path';
import type { DataSourceOptions } from 'typeorm';

import { createInjectionToken } from '@shared/di-container';

import { entities } from '../../AssessmentsRepository';

export type TypeORMConfig = { type: 'postgres' } & DataSourceOptions;

export const defaultTypeORMConfig: TypeORMConfig = {
  type: 'postgres',
  port: 5432,
  host: process.env.DB_HOST,
  database: 'postgres',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities,
  migrations: [path.join(__dirname, 'migrations/*.js')], // In production, we use the compiled js files
};

export const testTypeORMConfig: TypeORMConfig = {
  ...defaultTypeORMConfig,
  host: '127.0.0.1',
  synchronize: true,
  logging: true,
  migrations: [],
};

export const tokenTypeORMConfig = createInjectionToken<TypeORMConfig>(
  'TypeORMConfig',
  {
    useValue: defaultTypeORMConfig,
  }
);
