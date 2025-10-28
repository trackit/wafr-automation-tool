import { DataSource } from 'typeorm';

import { testTenantsTypeORMConfig } from './config';

export default new DataSource({
  ...testTenantsTypeORMConfig,
  synchronize: false,
  migrations: [
    './libs/backend/infrastructure/src/lib/config/typeorm/tenantsMigrations/*.ts',
  ],
});
