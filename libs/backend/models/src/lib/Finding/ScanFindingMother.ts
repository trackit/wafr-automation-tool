import {
  type FindingMetadata,
  type FindingRemediation,
  type FindingResource,
  type ScanFinding,
  SeverityType,
} from './Finding';

export class ScanFindingMother {
  private data: ScanFinding;

  private constructor(data: ScanFinding) {
    this.data = data;
  }

  public static basic(): ScanFindingMother {
    return new ScanFindingMother({
      id: 'tool#1',
    });
  }

  public withId(id: string): ScanFindingMother {
    this.data.id = id;
    return this;
  }

  public withMetadata(metadata: FindingMetadata): ScanFindingMother {
    this.data.metadata = metadata;
    return this;
  }

  public withRemediation(remediation: FindingRemediation): ScanFindingMother {
    this.data.remediation = remediation;
    return this;
  }

  public withResources(resources: FindingResource[]): ScanFindingMother {
    this.data.resources = resources;
    return this;
  }

  public withRiskDetails(riskDetails?: string): ScanFindingMother {
    this.data.riskDetails = riskDetails;
    return this;
  }

  public withSeverity(severity: SeverityType): ScanFindingMother {
    this.data.severity = severity;
    return this;
  }

  public withStatusCode(statusCode?: string): ScanFindingMother {
    this.data.statusCode = statusCode;
    return this;
  }

  public withStatusDetail(statusDetail?: string): ScanFindingMother {
    this.data.statusDetail = statusDetail;
    return this;
  }

  public build(): ScanFinding {
    return this.data;
  }
}
