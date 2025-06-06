import { Assessment, User } from '@backend/models';

export interface WellArchitectedToolPort {
  exportAssessment(args: Assessment, user: User): Promise<void>;
}
