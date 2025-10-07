import { FindingRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

import { FindingsRepositorySQL } from './FindingsRepositorySQL';

export const tokenFindingsRepository = createInjectionToken<FindingRepository>(
  'FindingRepository',
  {
    useClass: FindingsRepositorySQL,
  },
);
