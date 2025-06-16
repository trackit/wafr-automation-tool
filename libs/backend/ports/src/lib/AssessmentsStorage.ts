export interface AssessmentsStorage {
  delete(assessmentId: string): Promise<void>;
}
