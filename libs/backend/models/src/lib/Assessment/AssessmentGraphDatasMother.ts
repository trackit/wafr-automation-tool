import { AssessmentGraphDatas } from './Assessment';

export class AssessmentGraphDatasMother {
  private data: AssessmentGraphDatas;

  private constructor(data: AssessmentGraphDatas) {
    this.data = data;
  }

  public static basic(): AssessmentGraphDatasMother {
    return new AssessmentGraphDatasMother({
      findings: 0,
      regions: {},
      resourceTypes: {},
      severities: {},
    });
  }

  public withFindings(findings: number): AssessmentGraphDatasMother {
    this.data.findings = findings;
    return this;
  }

  public withRegions(
    regions: Record<string, number>
  ): AssessmentGraphDatasMother {
    this.data.regions = regions;
    return this;
  }

  public withResourceTypes(
    resourceTypes: Record<string, number>
  ): AssessmentGraphDatasMother {
    this.data.resourceTypes = resourceTypes;
    return this;
  }

  public withSeverities(
    severities: Record<string, number>
  ): AssessmentGraphDatasMother {
    this.data.severities = severities;
    return this;
  }

  public build(): AssessmentGraphDatas {
    return this.data;
  }
}
