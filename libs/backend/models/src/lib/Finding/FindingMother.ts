import {
  type FindingMetadata,
  SeverityType,
  type Finding,
  type FindingRemediation,
  type FindingResource,
} from './Finding';

export class FindingMother {
  private data: Finding;

  private constructor(data: Finding) {
    this.data = data;
  }

  public static basic(): FindingMother {
    return new FindingMother({
      bestPractices: '1#1#1',
      hidden: false,
      id: 'finding-id',
      isAIAssociated: false,
      metadata: { eventCode: 'event-code' },
      remediation: {
        desc: 'This is a remediation description.',
        references: [],
      },
      resources: [],
      severity: SeverityType.Medium,
    });
  }

  public withBestPractices(bestPractices: string): FindingMother {
    this.data.bestPractices = bestPractices;
    return this;
  }

  public withHidden(hidden: boolean): FindingMother {
    this.data.hidden = hidden;
    return this;
  }

  public withId(id: string): FindingMother {
    this.data.id = id;
    return this;
  }

  public withIsAIAssociated(isAiAssociated: boolean): FindingMother {
    this.data.isAIAssociated = isAiAssociated;
    return this;
  }

  public withMetadata(metadata: FindingMetadata): FindingMother {
    this.data.metadata = metadata;
    return this;
  }

  public withRemediation(remediation: FindingRemediation): FindingMother {
    this.data.remediation = remediation;
    return this;
  }

  public withResources(resources: FindingResource[]): FindingMother {
    this.data.resources = resources;
    return this;
  }

  public withRiskDetails(riskDetails?: string): FindingMother {
    this.data.riskDetails = riskDetails;
    return this;
  }

  public withSeverity(severity: SeverityType): FindingMother {
    this.data.severity = severity;
    return this;
  }

  public withStatusCode(statusCode?: string): FindingMother {
    this.data.statusCode = statusCode;
    return this;
  }

  public withStatusDetail(statusDetail?: string): FindingMother {
    this.data.statusDetail = statusDetail;
    return this;
  }

  public build(): Finding {
    return this.data;
  }
}
