import { User } from '@backend/models';

export interface CognitoPort {
  getUserById(args: { userId: string }): Promise<User>;
}
