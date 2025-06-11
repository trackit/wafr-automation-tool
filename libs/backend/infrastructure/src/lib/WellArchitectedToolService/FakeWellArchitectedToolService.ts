/* eslint-disable @typescript-eslint/no-unused-vars */
import { Assessment, User } from '@backend/models';
import type { WellArchitectedToolPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeWellArchitectedToolService implements WellArchitectedToolPort {
  public async exportAssessment(
    _assessment: Assessment,
    _user: User
  ): Promise<void> {
    // No-op for fake implementation
  }
}

export const tokenFakeWellArchitectedToolService =
  createInjectionToken<FakeWellArchitectedToolService>(
    'FakeWellArchitectedToolService',
    { useClass: FakeWellArchitectedToolService }
  );
