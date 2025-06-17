import type { ObjectStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeObjectStorage implements ObjectStorage {
  list(args: { prefix: string }): Promise<string[]> {
    // No-op for fake implementation
    return Promise.resolve([]);
  }

  bulkDelete(args: { keys: string[] }): Promise<void> {
    // No-op for fake implementation
    return Promise.resolve();
  }
}

export const tokenFakeObjectStorage = createInjectionToken<FakeObjectStorage>(
  'FakeObjectStorage',
  {
    useClass: FakeObjectStorage,
  }
);
