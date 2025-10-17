import { DataSource } from 'typeorm';

import { testTypeORMConfig } from './config';

export default new DataSource({
  ...testTypeORMConfig,
  synchronize: false,
  migrations: [
    './libs/backend/infrastructure/src/lib/config/typeorm/migrations/*.ts',
  ],
});
