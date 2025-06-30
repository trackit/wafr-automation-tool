import { IdGenerator } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';
import { randomUUID } from 'crypto';

export class IdGeneratorCrypto implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}

export const tokenIdGenerator = createInjectionToken<IdGenerator>(
  'IdGenerator',
  {
    useClass: IdGeneratorCrypto,
  }
);
