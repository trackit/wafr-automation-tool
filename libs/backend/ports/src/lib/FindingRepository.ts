import {
  type Finding,
  type FindingAggregationFields,
  type FindingAggregationResult,
  type FindingBody,
  type FindingComment,
  type FindingCommentBody,
} from '@backend/models';

export interface AssessmentsRepositoryGetBestPracticeFindingsArgs {
  assessmentId: string;
  organizationDomain: string;
  version: number;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  limit?: number;
  searchTerm?: string;
  showHidden?: boolean;
  nextToken?: string;
}

export interface FindingRepository {
  save(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void>;

  saveAll(args: {
    assessmentId: string;
    organizationDomain: string;
    findings: Finding[];
  }): Promise<void>;

  saveComment(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    findingId: string;
    comment: FindingComment;
  }): Promise<void>;

  get(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    findingId: string;
  }): Promise<Finding | undefined>;

  getAll(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
  }): Promise<Finding[]>;

  getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs,
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }>;

  deleteAll(args: {
    assessmentId: string;
    organizationDomain: string;
    version?: number;
  }): Promise<void>;

  deleteComment(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    findingId: string;
    commentId: string;
  }): Promise<void>;

  update(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void>;

  updateComment(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    findingId: string;
    commentId: string;
    commentBody: FindingCommentBody;
  }): Promise<void>;
  saveBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }): Promise<void>;
  countBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): Promise<number>;

  aggregateAll<TFields extends FindingAggregationFields>(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    fields: TFields;
  }): Promise<FindingAggregationResult<TFields>>;

  countAll(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
  }): Promise<number>;
}
