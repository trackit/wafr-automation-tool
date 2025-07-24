import { Assessment, User } from '@backend/models';

export interface WellArchitectedToolPort {
  exportAssessment(args: {
    roleArn: string;
    assessment: Assessment;
    region: string;
    user: User;
  }): Promise<void>;
}
