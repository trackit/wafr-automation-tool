import { type AssessmentsRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

import { AssessmentsRepositorySQL } from './AssessmentsRepositorySQL';

export const tokenAssessmentsRepository =
  createInjectionToken<AssessmentsRepository>('AssessmentsRepository', {
    useClass: AssessmentsRepositorySQL,
  });
