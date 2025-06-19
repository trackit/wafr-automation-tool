import type { ObjectsStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeObjectsStorage implements ObjectsStorage {
  public objects: Record<string, string> = {};

  public async put(args: { key: string; body: string }): Promise<void> {
    this.objects[args.key] = args.body;
  }

  public async list(args: { prefix: string }): Promise<string[]> {
    const objects = Object.keys(this.objects).filter((object) =>
      object.startsWith(args.prefix)
    );
    return objects;
  }

  public async bulkDelete(args: { keys: string[] }): Promise<void> {
    args.keys.forEach((key) => delete this.objects[key]);
  }
}

export const tokenFakeObjectsStorage = createInjectionToken<FakeObjectsStorage>(
  'FakeObjectsStorage',
  {
    useClass: FakeObjectsStorage,
  }
);
