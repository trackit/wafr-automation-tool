import { User } from '@backend/models';
import type { StartAssessmentUseCaseArgs } from './startAssessment';

export class StartAssessmentUseCaseArgsMother {
  private data: StartAssessmentUseCaseArgs;

  private constructor(data: StartAssessmentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): StartAssessmentUseCaseArgsMother {
    return new StartAssessmentUseCaseArgsMother({
      name: 'Basic Assessment',
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
    });
  }

  public withName(name: string): StartAssessmentUseCaseArgsMother {
    this.data.name = name;
    return this;
  }

  public withRegions(regions?: string[]): StartAssessmentUseCaseArgsMother {
    this.data.regions = regions;
    return this;
  }

  public withRoleArn(roleArn: string): StartAssessmentUseCaseArgsMother {
    this.data.roleArn = roleArn;
    return this;
  }

  public withWorkflows(workflows?: string[]): StartAssessmentUseCaseArgsMother {
    this.data.workflows = workflows;
    return this;
  }

  public withUser(user: User): StartAssessmentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): StartAssessmentUseCaseArgs {
    return this.data;
  }
}
