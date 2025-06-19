import type { ObjectsStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeObjectsStorage implements ObjectsStorage {
  public objects: Record<string, string> = {};

  put(args: { key: string; object: string }): Promise<void> {
    this.objects[args.key] = args.object;
    return Promise.resolve();
  }

  list(args: { prefix: string }): Promise<string[]> {
    const objects = Object.values(this.objects).filter((object) =>
      object.startsWith(args.prefix)
    );
    return Promise.resolve(objects);
  }

  bulkDelete(args: { keys: string[] }): Promise<void> {
    args.keys.forEach((key) => delete this.objects[key]);
    return Promise.resolve();
  }
}

export const tokenFakeObjectsStorage = createInjectionToken<FakeObjectsStorage>(
  'FakeObjectsStorage',
  {
    useClass: FakeObjectsStorage,
  }
);
