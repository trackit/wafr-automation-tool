/* eslint-disable @typescript-eslint/no-unused-vars */
import { Assessment, Milestone, MilestoneSummary, User } from '@backend/models';
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

  public async getMilestone(_args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    milestoneId: number;
  }): Promise<Milestone> {
    // No-op for fake implementation
    return {} as Milestone;
  }

  public async getMilestones(_args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    limit?: number;
    nextToken?: string;
  }): Promise<{
    milestones: MilestoneSummary[];
    nextToken?: string;
  }> {
    // No-op for fake implementation
    return { milestones: [] };
  }
}

export const tokenFakeWellArchitectedToolService =
  createInjectionToken<FakeWellArchitectedToolService>(
    'FakeWellArchitectedToolService',
    { useClass: FakeWellArchitectedToolService }
  );
