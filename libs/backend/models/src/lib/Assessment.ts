export interface Assessment {
  id: string;
  name: string;
  regions: string[];
  roleArn: string;
  workflows: string[];
  createdAt: Date;
  createdBy: string;
  organization: string;
  executionArn?: string;
}

export class AssessmentMother {
  private data: Assessment;

  private constructor(data: Assessment) {
    this.data = data;
  }

  public static basic(): AssessmentMother {
    return new AssessmentMother({
      id: 'assessment-id',
      name: 'Test Assessment',
      createdBy: 'user-id',
      createdAt: new Date(),
      organization: 'organization-id',
      regions: ['us-west-2'],
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
      workflows: ['workflow1', 'workflow2'],
    });
  }

  public withId(id: string): AssessmentMother {
    this.data.id = id;
    return this;
  }

  public withName(name: string): AssessmentMother {
    this.data.name = name;
    return this;
  }

  public withCreatedBy(createdBy: string): AssessmentMother {
    this.data.createdBy = createdBy;
    return this;
  }

  public withCreatedAt(createdAt: Date): AssessmentMother {
    this.data.createdAt = createdAt;
    return this;
  }

  public withOrganization(organization: string): AssessmentMother {
    this.data.organization = organization;
    return this;
  }

  public withRegions(regions: string[]): AssessmentMother {
    this.data.regions = regions;
    return this;
  }

  public withRoleArn(roleArn: string): AssessmentMother {
    this.data.roleArn = roleArn;
    return this;
  }

  public withWorkflows(workflows: string[]): AssessmentMother {
    this.data.workflows = workflows;
    return this;
  }

  public withExecutionArn(executionArn: string): AssessmentMother {
    this.data.executionArn = executionArn;
    return this;
  }

  public build(): Assessment {
    return this.data;
  }
}
