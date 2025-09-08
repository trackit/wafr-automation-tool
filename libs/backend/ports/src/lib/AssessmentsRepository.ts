import type {
  Assessment,
  AssessmentBody,
  AssessmentGraphData,
  BestPracticeBody,
  Finding,
  FindingBody,
  FindingComment,
  FindingCommentBody,
  PillarBody,
  QuestionBody,
  ScanningTool,
} from '@backend/models';

export interface AssessmentsRepositoryGetBestPracticeFindingsArgs {
  assessmentId: string;
  organizationDomain: string;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  limit?: number;
  searchTerm?: string;
  showHidden?: boolean;
  nextToken?: string;
}

export interface AssessmentsRepository {
  save(assessment: Assessment): Promise<void>;
  saveFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void>;
  getAll(args: {
    organizationDomain: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{
    assessments: Assessment[];
    nextToken?: string;
  }>;
  get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined>;
  getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }>;
  getFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
  }): Promise<Finding | undefined>;
  addFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    comment: FindingComment;
  }): Promise<void>;
  delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void>;
  deleteFindings(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void>;
  deleteFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
  }): Promise<void>;
  update(args: {
    assessmentId: string;
    organizationDomain: string;
    assessmentBody: AssessmentBody;
  }): Promise<void>;
  updatePillar(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void>;
  updateBestPractice(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void>;
  addBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }): Promise<void>;
  updateFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void>;
  updateFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
    commentBody: FindingCommentBody;
  }): Promise<void>;
  updateQuestion(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void>;
  updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organizationDomain: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void>;
}
