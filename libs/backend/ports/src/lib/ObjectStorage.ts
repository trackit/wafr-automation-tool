export interface ObjectStorage {
  list(args: { prefix: string }): Promise<string[]>;
  bulkDelete(args: { keys: string[] }): Promise<void>;
}
