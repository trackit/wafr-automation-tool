import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type StartAssessmentBody =
  operations['startAssessment']['requestBody']['content']['application/json'];

export class StartAssessmentAdapterEventMother {
  private body: StartAssessmentBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(body: StartAssessmentBody) {
    this.body = body;
  }

  public static basic(): StartAssessmentAdapterEventMother {
    return new StartAssessmentAdapterEventMother({
      name: 'Basic Assessment',
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
    });
  }

  public withName(name: string): StartAssessmentAdapterEventMother {
    this.body.name = name;
    return this;
  }

  public withRegions(regions?: string[]): StartAssessmentAdapterEventMother {
    this.body.regions = regions;
    return this;
  }

  public withRoleArn(roleArn: string): StartAssessmentAdapterEventMother {
    this.body.roleArn = roleArn;
    return this;
  }

  public withWorkflows(
    workflows?: string[]
  ): StartAssessmentAdapterEventMother {
    this.body.workflows = workflows;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): StartAssessmentAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
