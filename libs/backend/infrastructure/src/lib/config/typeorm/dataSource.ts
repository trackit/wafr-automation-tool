import { DataSource } from 'typeorm';

import { testTypeORMConfig } from './config';

export default new DataSource(testTypeORMConfig);
