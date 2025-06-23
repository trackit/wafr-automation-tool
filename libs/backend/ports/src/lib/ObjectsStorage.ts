export interface ObjectsStorage {
  get(key: string): Promise<string | null>;
  list(prefix: string): Promise<string[]>;
  bulkDelete(keys: string[]): Promise<void>;
  put(args: { key: string; body: string }): Promise<string>;
  parseURI(uri: string): { bucket: string; key: string };
  delete(key: string): Promise<void>;
}
