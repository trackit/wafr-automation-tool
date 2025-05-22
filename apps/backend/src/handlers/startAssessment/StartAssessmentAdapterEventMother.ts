import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../APIGatewayProxyEventMother';

export class StartAssessmentAdapterEventMother {
  private data: operations['startAssessment']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    data: operations['startAssessment']['requestBody']['content']['application/json']
  ) {
    this.data = data;
  }

  public static basic(): StartAssessmentAdapterEventMother {
    return new StartAssessmentAdapterEventMother({
      name: 'Basic Assessment',
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
    });
  }

  public withName(
    name: operations['startAssessment']['requestBody']['content']['application/json']['name']
  ): StartAssessmentAdapterEventMother {
    this.data.name = name;
    return this;
  }

  public withRegions(
    regions: operations['startAssessment']['requestBody']['content']['application/json']['regions']
  ): StartAssessmentAdapterEventMother {
    this.data.regions = regions;
    return this;
  }

  public withRoleArn(
    roleArn: operations['startAssessment']['requestBody']['content']['application/json']['roleArn']
  ): StartAssessmentAdapterEventMother {
    this.data.roleArn = roleArn;
    return this;
  }

  public withWorkflows(
    workflows: operations['startAssessment']['requestBody']['content']['application/json']['workflows']
  ): StartAssessmentAdapterEventMother {
    this.data.workflows = workflows;
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
      .withBody(JSON.stringify(this.data))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
