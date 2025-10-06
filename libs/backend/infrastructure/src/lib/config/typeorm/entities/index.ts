import { assessmentsEntities } from './assessmentsEntities';
import { findingEntities } from './findingsEntities';

export * from './assessmentsEntities';
export * from './findingsEntities';
export * from './tenantsEntities';

export const entities = [...assessmentsEntities, ...findingEntities];
