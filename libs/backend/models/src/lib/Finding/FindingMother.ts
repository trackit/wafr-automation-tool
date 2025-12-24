import { type BestPractice } from '../BestPractice';
import {
  type Finding,
  type FindingComment,
  type FindingRemediation,
  type FindingResource,
  SeverityType,
} from './Finding';

export class FindingMother {
  private data: Finding;

  private constructor(data: Finding) {
    this.data = data;
  }

  public static basic(): FindingMother {
    return new FindingMother({
      bestPractices: [],
      hidden: false,
      id: 'finding-id',
      version: 1,
      isAIAssociated: false,
      eventCode: 'event-code',
      remediation: {
        desc: 'This is a remediation description.',
        references: [],
      },
      resources: [],
      riskDetails: '',
      severity: SeverityType.Medium,
      statusCode: '',
      statusDetail: '',
      comments: [],
    });
  }

  public withBestPractices(bestPractices: BestPractice[]): FindingMother {
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

  public withIsAIAssociated(isAIAssociated: boolean): FindingMother {
    this.data.isAIAssociated = isAIAssociated;
    return this;
  }

  public withEventCode(eventCode?: string): FindingMother {
    this.data.eventCode = eventCode;
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

  public withRiskDetails(riskDetails: string): FindingMother {
    this.data.riskDetails = riskDetails;
    return this;
  }

  public withSeverity(severity: SeverityType): FindingMother {
    this.data.severity = severity;
    return this;
  }

  public withStatusCode(statusCode: string): FindingMother {
    this.data.statusCode = statusCode;
    return this;
  }

  public withStatusDetail(statusDetail: string): FindingMother {
    this.data.statusDetail = statusDetail;
    return this;
  }

  public withComments(comments: FindingComment[] | undefined): FindingMother {
    this.data.comments = comments;
    return this;
  }

  public withVersion(version: number): FindingMother {
    this.data.version = version;
    return this;
  }

  public build(): Finding {
    return this.data;
  }
}
