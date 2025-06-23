export interface Finding extends ScanFinding {
  hidden: boolean;
  isAiAssociated: boolean;
  bestPractices: string;
}

export interface ScanFinding {
  id: string;
  metadata?: FindingMetadata;
  remediation?: FindingRemediation;
  resources?: FindingResource[];
  riskDetails?: string;
  severity?: SeverityType;
  statusCode?: string;
  statusDetail?: string;
}

export interface FindingMetadata {
  eventCode?: string;
}

export interface FindingRemediation {
  desc: string;
  references?: string[];
}

export interface FindingResource {
  name?: string;
  region?: string;
  type?: string;
  uid?: string;
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

export interface FindingBody {
  hidden?: boolean;
}
