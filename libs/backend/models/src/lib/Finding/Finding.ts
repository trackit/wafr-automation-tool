export interface Finding {
  bestPractices: string;
  hidden: boolean;
  id: string;
  isAiAssociated: boolean;
  metadata: FindingMetadata;
  remediation: FindingRemediation;
  resources: FindingResource[];
  riskDetails: string;
  severity: SeverityType;
  statusCode: string;
  statusDetail: string;
}

export interface FindingMetadata {
  eventCode: string;
}

export interface FindingRemediation {
  desc: string;
  references: string[];
}

export interface FindingResource {
  name: string;
  region: string;
  type: string;
  uid: string;
}

export enum SeverityType {
  Unknown = 'Unknown',
  Informational = 'Informational',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
  Fatal = 'Fatal',
  Other = 'Other',
}
