/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ObjectsStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeObjectsStorage implements ObjectsStorage {
  list(args: { prefix: string }): Promise<string[]> {
    // No-op for fake implementation
    return Promise.resolve([]);
  }

  bulkDelete(args: { keys: string[] }): Promise<void> {
    // No-op for fake implementation
    return Promise.resolve();
  }
}

export const tokenFakeObjectsStorage = createInjectionToken<FakeObjectsStorage>(
  'FakeObjectsStorage',
  {
    useClass: FakeObjectsStorage,
  }
);
