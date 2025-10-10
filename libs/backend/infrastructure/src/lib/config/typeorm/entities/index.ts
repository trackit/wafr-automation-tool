import { assessmentsEntities } from './assessmentsEntities';
import { findingEntities } from './findingsEntities';
import { organizationsEntities } from './organizationsEntities';
import { Tenant } from './tenantsEntities';

export * from './assessmentsEntities';
export * from './findingsEntities';
export * from './organizationsEntities';
export * from './tenantsEntities';

export const entities = [...assessmentsEntities, ...findingEntities];
export const tenantsEntities = [Tenant, ...organizationsEntities];
