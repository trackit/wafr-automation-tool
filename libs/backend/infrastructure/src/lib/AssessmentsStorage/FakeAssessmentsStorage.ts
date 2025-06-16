import type { AssessmentsStorage } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAssessmentsStorage implements AssessmentsStorage {
  delete(assessmentId: string): Promise<void> {
    // No-op for fake implementation
    return Promise.resolve();
  }
}

export const tokenFakeAssessmentsStorage =
  createInjectionToken<FakeAssessmentsStorage>('FakeAssessmentsStorage', {
    useClass: FakeAssessmentsStorage,
  });
