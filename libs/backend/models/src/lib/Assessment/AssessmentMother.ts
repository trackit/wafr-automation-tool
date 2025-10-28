import type { Pillar } from '../Pillar';
import type { ScanningTool } from '../ScanningTool';
import {
  type Assessment,
  type AssessmentFileExports,
  type AssessmentGraphData,
} from './Assessment';

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
      pillars: [],
      graphData: {
        findings: 0,
        regions: {},
        resourceTypes: {},
        severities: {},
      },
      id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      name: 'Test Assessment',
      organization: 'organization-id',
      questionVersion: '1.0',
      rawGraphData: {},
      regions: [],
      roleArn: 'arn:aws:iam::123456789012:role/test-role',
      finishedAt: undefined,
      workflows: [],
      fileExports: {},
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

  public withPillars(pillars: Pillar[] | undefined): AssessmentMother {
    this.data.pillars = pillars;
    return this;
  }

  public withGraphData(graphData: AssessmentGraphData): AssessmentMother {
    this.data.graphData = graphData;
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

  public withRawGraphData(
    rawGraphData: Partial<Record<ScanningTool, AssessmentGraphData>>,
  ): AssessmentMother {
    this.data.rawGraphData = rawGraphData;
    return this;
  }

  public withRegions(regions: string[]): AssessmentMother {
    this.data.regions = regions;
    return this;
  }

  public withExportRegion(exportRegion?: string): AssessmentMother {
    this.data.exportRegion = exportRegion;
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

  public withFileExports(fileExports: AssessmentFileExports): AssessmentMother {
    this.data.fileExports = fileExports;
    return this;
  }

  public withOpportunityId(
    opportunityId: string | undefined,
  ): AssessmentMother {
    this.data.opportunityId = opportunityId;
    return this;
  }

  public withWAFRWorkloadArn(
    wafrWorkloadArn: string | undefined,
  ): AssessmentMother {
    this.data.wafrWorkloadArn = wafrWorkloadArn;
    return this;
  }

  public withFinishedAt(finishedAt: Date | undefined): AssessmentMother {
    this.data.finishedAt = finishedAt;
    return this;
  }

  public withOpportunityCreatedAt(
    opportunityCreatedAt: Date | undefined,
  ): AssessmentMother {
    this.data.opportunityCreatedAt = opportunityCreatedAt;
    return this;
  }

  public build(): Assessment {
    return this.data;
  }
}
