import type {
  Assessment,
  Milestone,
  MilestoneSummary,
  User,
} from '@backend/models';

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
  getMilestone(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    milestoneId: number;
  }): Promise<Milestone>;
  getMilestones(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
  }): Promise<MilestoneSummary[]>;
}
