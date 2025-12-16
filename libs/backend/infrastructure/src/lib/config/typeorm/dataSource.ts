import { DataSource } from 'typeorm';

import { getTestTypeORMConfig } from './config';

export default new DataSource({
  ...getTestTypeORMConfig(),
  synchronize: false,
  migrations: [
    './libs/backend/infrastructure/src/lib/config/typeorm/migrations/*.ts',
  ],
});
