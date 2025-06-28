import type {
  Assessment,
  AssessmentBody,
  BestPracticeBody,
  Finding,
  FindingBody,
  PillarBody,
  QuestionBody,
} from '@backend/models';

export interface AssessmentsRepositoryGetBestPracticeFindingsArgs {
  assessmentId: string;
  organization: string;
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
    organization: string;
    finding: Finding;
  }): Promise<void>;
  getAll(args: {
    organization: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{
    assessments: Assessment[];
    nextToken?: string;
  }>;
  get(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined>;
  getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }>;
  getFinding(args: {
    assessmentId: string;
    findingId: string;
    organization: string;
  }): Promise<Finding | undefined>;
  delete(args: { assessmentId: string; organization: string }): Promise<void>;
  deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void>;
  update(args: {
    assessmentId: string;
    organization: string;
    assessmentBody: AssessmentBody;
  }): Promise<void>;
  updatePillar(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void>;
  updateBestPractice(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void>;
  updateBestPracticeFindings(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: string[];
  }): Promise<void>;
  updateFinding(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void>;
  updateQuestion(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void>;
}
