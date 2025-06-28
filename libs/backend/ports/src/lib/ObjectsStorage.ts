export interface ObjectsStorage {
  get(args: { key: string }): Promise<string>;
  list(args: { prefix: string }): Promise<string[]>;
  bulkDelete(args: { keys: string[] }): Promise<void>;
  put(args: { key: string; body: string }): Promise<void>;
  parseURI(uri: string): { bucket: string; key: string };
}
