import type { ObjectsStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeObjectsStorage implements ObjectsStorage {
  public objects: Record<string, string> = {};

  public async put(args: { key: string; body: string }): Promise<string> {
    this.objects[args.key] = args.body;
    return `https://fake-storage.com/${args.key}`;
  }

  public async get(key: string): Promise<string | null> {
    const object = this.objects[key];
    if (!object) {
      return null;
    }
    return object;
  }

  public async list(prefix: string): Promise<string[]> {
    const objects = Object.keys(this.objects).filter((object) =>
      object.startsWith(prefix)
    );
    return objects;
  }

  public async bulkDelete(keys: string[]): Promise<void> {
    keys.forEach((key) => this.delete(key));
  }

  public parseURI(uri: string): { bucket: string; key: string } {
    const { hostname: bucket, pathname } = new URL(uri);
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    return { bucket, key };
  }

  public async delete(key: string): Promise<void> {
    delete this.objects[key];
  }
}

export const tokenFakeObjectsStorage = createInjectionToken<FakeObjectsStorage>(
  'FakeObjectsStorage',
  {
    useClass: FakeObjectsStorage,
  }
);
