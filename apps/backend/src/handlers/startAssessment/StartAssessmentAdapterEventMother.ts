import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { operations } from '@shared/api-schema';
import { APIGatewayProxyEventV2Mother } from '../APIGatewayProxyEventV2Mother';

export class StartAssessmentAdapterEventMother {
  private data: operations['startAssessment']['requestBody']['content']['application/json'];

  private constructor(
    data: operations['startAssessment']['requestBody']['content']['application/json']
  ) {
    this.data = data;
  }

  public static basic(): StartAssessmentAdapterEventMother {
    return new StartAssessmentAdapterEventMother({
      name: 'Basic Assessment',
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

  public build(): APIGatewayProxyEventV2 {
    return APIGatewayProxyEventV2Mother.basic()
      .withBody(JSON.stringify(this.data))
      .build();
  }
}
