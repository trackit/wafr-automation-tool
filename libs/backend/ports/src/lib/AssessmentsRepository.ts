import type {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  BestPracticeBody,
  BillingInformation,
  PillarBody,
  QuestionBody,
} from '@backend/models';

export interface AssessmentsRepository {
  save(assessment: Assessment): Promise<void>;
  saveFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    fileExport: AssessmentFileExport;
  }): Promise<void>;

  get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined>;
  getAll(args: {
    organizationDomain: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{
    assessments: Assessment[];
    nextToken?: string;
  }>;

  delete(args: {
    assessmentId: string;
    organizationDomain: string;
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
  updateQuestion(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void>;
  updateBestPractice(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void>;
  updateFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    data: AssessmentFileExport;
  }): Promise<void>;
  deleteFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    id: string;
  }): Promise<void>;
  getOpportunitiesByYear(args: {
    organizationDomain: string;
    year: number;
  }): Promise<Array<{ id: string; createdAt: Date }>>;
  countAssessmentsByYear(args: {
    organizationDomain: string;
    year: number;
  }): Promise<number>;
  saveBillingInformation(args: {
    assessmentId: string;
    organizationDomain: string;
    billingInformation: BillingInformation;
  }): Promise<void>;
  updateAssessmentsByFolder(args: {
    organizationDomain: string;
    oldFolderName: string;
    newFolderName: string;
  }): Promise<void>;
  clearAssessmentsFolder(args: {
    organizationDomain: string;
    folderName: string;
  }): Promise<void>;
}
