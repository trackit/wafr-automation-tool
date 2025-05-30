import type { Pillar } from '../Pillar';
import type { Assessment, AssessmentGraphDatas } from './Assessment';

export class AssessmentMother {
  private data: Assessment;

  private constructor(data: Assessment) {
    this.data = data;
  }

  public static basic(): AssessmentMother {
    return new AssessmentMother({
      createdAt: new Date(),
      createdBy: 'user-id',
      executionArn:
        'arn:aws:states:us-west-2:123456789012:execution:state-machine:execution-arn',
      findings: [],
      graphDatas: {
        findings: 0,
        regions: {},
        resourceTypes: {},
        severities: {},
      },
      id: 'assessment-id',
      name: 'Test Assessment',
      organization: 'organization-id',
      questionVersion: '1.0',
      rawGraphDatas: {},
      regions: ['us-west-2'],
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
      workflows: ['workflow1', 'workflow2'],
    });
  }

  public withCreatedAt(createdAt: Date): AssessmentMother {
    this.data.createdAt = createdAt;
    return this;
  }

  public withCreatedBy(createdBy: string): AssessmentMother {
    this.data.createdBy = createdBy;
    return this;
  }

  public withExecutionArn(executionArn: string): AssessmentMother {
    this.data.executionArn = executionArn;
    return this;
  }

  public withFindings(findings: Pillar[]): AssessmentMother {
    this.data.findings = findings;
    return this;
  }

  public withGraphDatas(graphDatas: AssessmentGraphDatas): AssessmentMother {
    this.data.graphDatas = graphDatas;
    return this;
  }

  public withId(id: string): AssessmentMother {
    this.data.id = id;
    return this;
  }

  public withName(name: string): AssessmentMother {
    this.data.name = name;
    return this;
  }

  public withOrganization(organization: string): AssessmentMother {
    this.data.organization = organization;
    return this;
  }

  public withQuestionVersion(questionVersion: string): AssessmentMother {
    this.data.questionVersion = questionVersion;
    return this;
  }

  public withRawGraphDatas(
    rawGraphDatas: Record<string, AssessmentGraphDatas>
  ): AssessmentMother {
    this.data.rawGraphDatas = rawGraphDatas;
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

  public build(): Assessment {
    return this.data;
  }
}
