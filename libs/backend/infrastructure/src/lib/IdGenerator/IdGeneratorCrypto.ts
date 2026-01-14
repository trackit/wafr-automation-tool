import { type IdGenerator } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class IdGeneratorCrypto implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}

export const tokenIdGenerator = createInjectionToken<IdGenerator>(
  'IdGenerator',
  {
    useClass: IdGeneratorCrypto,
  },
);
