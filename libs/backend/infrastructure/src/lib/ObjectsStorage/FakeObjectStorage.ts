import type { ObjectsStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeObjectsStorage implements ObjectsStorage {
  public objects: Record<string, string> = {};

  public async put(args: { key: string; body: string }): Promise<void> {
    this.objects[args.key] = args.body;
  }
}

export const tokenFakeObjectsStorage = createInjectionToken<FakeObjectsStorage>(
  'FakeObjectsStorage',
  {
    useClass: FakeObjectsStorage,
  }
);
