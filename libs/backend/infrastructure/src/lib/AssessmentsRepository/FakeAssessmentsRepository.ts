import type {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  AssessmentFileExportType,
  AssessmentGraphData,
  BestPracticeBody,
  PillarBody,
  Question,
  QuestionBody,
  ScanningTool,
} from '@backend/models';
import type { AssessmentsRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';
import { decodeNextToken } from '@shared/utils';

export class FakeAssessmentsRepository implements AssessmentsRepository {
  public assessments: Record<string, Assessment> = {};

  public async save(assessment: Assessment): Promise<void> {
    const key = `${assessment.id}#${assessment.organization}`;
    this.assessments[key] = assessment;
  }

  public async saveBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeFindingIds,
    } = args;
    const assessment =
      this.assessments[`${assessmentId}#${organizationDomain}`];
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString(),
    );
    const question = pillar?.questions.find(
      (question) => question.id === questionId.toString(),
    );
    const bestPractice = question?.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString(),
    );
    if (!bestPractice) {
      throw new Error();
    }
    for (const findingId of bestPracticeFindingIds) {
      bestPractice.results.add(findingId);
    }
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organizationDomain } = args;
    return this.assessments[`${assessmentId}#${organizationDomain}`];
  }

  public async getAll(args: {
    organizationDomain: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{
    assessments: Assessment[];
    nextToken?: string;
  }> {
    const { organizationDomain, limit, search, nextToken } = args;
    const assessments = Object.values(this.assessments)
      .filter((assessment) => assessment.organization === organizationDomain)
      .filter((assessment) => {
        if (search) {
          return (
            assessment.name.includes(search) ||
            assessment.id.startsWith(search) ||
            assessment.roleArn.includes(search)
          );
        }
        return true;
      })
      .slice(0, limit);
    if (nextToken) {
      decodeNextToken(nextToken);
    }
    return {
      assessments,
      nextToken,
    };
  }

  public async delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;
    delete this.assessments[`${assessmentId}#${organizationDomain}`];
  }

  private updateAssessmentBody<T extends keyof Assessment>(
    assessment: Assessment,
    field: T,
    value: Assessment[T],
  ): void {
    assessment[field] = value;
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, assessmentBody } = args;
    const assessment =
      this.assessments[`${assessmentId}#${organizationDomain}`];
    for (const [key, value] of Object.entries(assessmentBody)) {
      this.updateAssessmentBody(
        assessment,
        key as keyof Assessment,
        value as Assessment[keyof Assessment],
      );
    }
  }

  public async updatePillar(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, pillarId, pillarBody } = args;
    const assessment =
      this.assessments[`${assessmentId}#${organizationDomain}`];
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString(),
    );
    if (!pillar) {
      throw new Error();
    }
    pillar.disabled = pillarBody.disabled ?? pillar.disabled;
  }

  private updateQuestionBody<T extends keyof QuestionBody>(
    question: QuestionBody,
    field: T,
    value: QuestionBody[T],
  ): void {
    question[field] = value;
  }

  public async updateQuestion(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      questionBody,
    } = args;
    const assessment =
      this.assessments[`${assessmentId}#${organizationDomain}`];
    const pillar = assessment.pillars?.find((pillar) => pillar.id === pillarId);
    const question = pillar?.questions.find(
      (question) => question.id === questionId,
    );
    for (const [key, value] of Object.entries(questionBody)) {
      this.updateQuestionBody(
        question as Question,
        key as keyof QuestionBody,
        value as QuestionBody[keyof QuestionBody],
      );
    }
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
    } = args;
    const assessment =
      this.assessments[`${assessmentId}#${organizationDomain}`];
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString(),
    );
    const question = pillar?.questions.find(
      (question) => question.id === questionId.toString(),
    );
    const bestPractice = question?.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString(),
    );
    if (!bestPractice) {
      throw new Error();
    }
    bestPractice.checked =
      args.bestPracticeBody.checked ?? bestPractice.checked;
  }

  public async updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organizationDomain: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void> {
    const { assessmentId, organizationDomain, scanningTool, graphData } = args;
    const assessment =
      this.assessments[`${assessmentId}#${organizationDomain}`];
    assessment.rawGraphData[scanningTool] = graphData;
  }

  public async updateFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    data: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organizationDomain, type, data } = args;

    const assessmentKey = `${assessmentId}#${organizationDomain}`;
    const assessment = this.assessments[assessmentKey];
    if (!assessment.fileExports) {
      assessment.fileExports = {};
    }
    const fileExports = assessment.fileExports;
    if (!fileExports[type]) {
      fileExports[type] = [];
    }
    const fileExportIndex = fileExports[type].findIndex(
      (fileExport) => fileExport.id === data.id,
    );
    if (fileExportIndex === -1) {
      fileExports[type].push(data);
      return;
    }
    Object.assign(fileExports[type][fileExportIndex], data);
  }

  public async deleteFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    id: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, type, id } = args;

    const assessmentKey = `${assessmentId}#${organizationDomain}`;
    const assessment = this.assessments[assessmentKey];
    if (!assessment.fileExports) {
      assessment.fileExports = {};
    }
    const fileExports = assessment.fileExports;
    if (!fileExports[type]) {
      fileExports[type] = [];
    }
    fileExports[type] = fileExports[type].filter(
      (fileExport) => fileExport.id !== id,
    );
  }

  public async getOpportunities(args: {
    organizationDomain: string;
  }): Promise<Array<{ opportunityId: string; opportunityCreatedAt: Date }>> {
    const { organizationDomain } = args;

    return Object.values(this.assessments)
      .filter((assessment) => assessment.organization === organizationDomain)
      .filter(
        (assessment) =>
          assessment.opportunityId !== undefined &&
          assessment.opportunityCreatedAt !== undefined,
      )
      .map((assessment) => ({
        opportunityId: assessment.opportunityId!,
        opportunityCreatedAt: assessment.opportunityCreatedAt!,
      }))
      .sort(
        (a, b) =>
          b.opportunityCreatedAt.getTime() - a.opportunityCreatedAt.getTime(),
      );
  }
}

export const tokenFakeAssessmentsRepository =
  createInjectionToken<FakeAssessmentsRepository>('FakeAssessmentsRepository', {
    useClass: FakeAssessmentsRepository,
  });
