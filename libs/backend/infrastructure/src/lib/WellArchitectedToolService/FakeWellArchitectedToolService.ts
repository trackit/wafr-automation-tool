/* eslint-disable @typescript-eslint/no-unused-vars */
import { Assessment, Milestone, Pillar, User } from '@backend/models';
import type { WellArchitectedToolPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeWellArchitectedToolService implements WellArchitectedToolPort {
  public async exportAssessment(_args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    user: User;
  }): Promise<string> {
    // No-op for fake implementation
    return '';
  }

  public async createMilestone(_args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    user: User;
  }): Promise<void> {
    // No-op for fake implementation
  }

  public async getMilestonePillars(_args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    milestoneId: number;
  }): Promise<Pillar[]> {
    // No-op for fake implementation
    return [];
  }

  public async getMilestones(_args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
  }): Promise<Milestone[]> {
    // No-op for fake implementation
    return [];
  }
}

export const tokenFakeWellArchitectedToolService =
  createInjectionToken<FakeWellArchitectedToolService>(
    'FakeWellArchitectedToolService',
    { useClass: FakeWellArchitectedToolService }
  );
