import { AssessmentGraphData } from './Assessment';

export class AssessmentGraphDataMother {
  private data: AssessmentGraphData;

  private constructor(data: AssessmentGraphData) {
    this.data = data;
  }

  public static basic(): AssessmentGraphDataMother {
    return new AssessmentGraphDataMother({
      findings: 0,
      regions: {},
      resourceTypes: {},
      severities: {},
    });
  }

  public withPillars(findings: number): AssessmentGraphDataMother {
    this.data.findings = findings;
    return this;
  }

  public withRegions(
    regions: Record<string, number>
  ): AssessmentGraphDataMother {
    this.data.regions = regions;
    return this;
  }

  public withResourceTypes(
    resourceTypes: Record<string, number>
  ): AssessmentGraphDataMother {
    this.data.resourceTypes = resourceTypes;
    return this;
  }

  public withSeverities(
    severities: Record<string, number>
  ): AssessmentGraphDataMother {
    this.data.severities = severities;
    return this;
  }

  public build(): AssessmentGraphData {
    return this.data;
  }
}
