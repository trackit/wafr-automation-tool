import { BestPractice } from '../models';

type AggregationFieldSelection<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? AggregationFieldSelection<U>
    : T[K] extends object
      ? AggregationFieldSelection<T[K]>
      : true;
};

type AggregationFieldResult<T> = {
  [K in keyof T]: NonNullable<T[K]> extends true
    ? Record<string, number>
    : NonNullable<T[K]> extends object
      ? AggregationFieldResult<NonNullable<T[K]>>
      : never;
};

export type FindingAggregationFields = AggregationFieldSelection<Finding>;
export type FindingAggregationResult<TFields extends FindingAggregationFields> =
  AggregationFieldResult<TFields>;

export interface Finding extends ScanFinding {
  hidden: boolean;
  isAIAssociated: boolean;
  bestPractices?: BestPractice[];
  comments?: FindingComment[];
}

export interface ScanFinding {
  id: string;
  eventCode?: string;
  remediation?: FindingRemediation;
  resources: FindingResource[];
  riskDetails: string;
  severity: SeverityType;
  statusCode: string;
  statusDetail: string;
}

export interface FindingRemediation {
  desc: string;
  references: string[];
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

export interface FindingComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

export interface FindingCommentBody {
  text?: string;
}

export interface FindingBody {
  hidden?: boolean;
}
