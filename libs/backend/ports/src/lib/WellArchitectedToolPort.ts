import type { Assessment, Milestone, Pillar, User } from '@backend/models';

export interface WellArchitectedToolPort {
  exportAssessment(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    user: User;
  }): Promise<string>;
  createMilestone(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    name: string;
    user: User;
  }): Promise<void>;
  getMilestonePillars(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    milestoneId: number;
  }): Promise<Pillar[]>;
  getMilestones(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
  }): Promise<Milestone[]>;
}
