import { type OrganizationRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

import { OrganizationRepositorySQL } from './OrganizationRepositorySQL';

export const tokenOrganizationRepository =
  createInjectionToken<OrganizationRepository>('OrganizationRepository', {
    useClass: OrganizationRepositorySQL,
  });
