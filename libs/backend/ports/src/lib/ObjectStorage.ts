export interface ObjectStorage {
  delete(assessmentId: string): Promise<void>;
  put(args: { key: string; body: string }): Promise<void>;
}
