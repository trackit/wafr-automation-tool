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
  Question,
  QuestionBody,
  ScanningTool,
} from '@backend/models';
import type {
  AssessmentsRepository,
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
} from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

import { AssessmentsRepositoryDynamoDB } from './AssessmentsRepositoryDynamoDB';

export class FakeAssessmentsRepository implements AssessmentsRepository {
  public assessments: Record<string, Assessment> = {};
  public assessmentFindings: Record<string, Finding[]> = {};

  public async save(assessment: Assessment): Promise<void> {
    const key = `${assessment.id}#${assessment.organization}`;
    this.assessments[key] = assessment;

    if (!this.assessmentFindings[key]) {
      this.assessmentFindings[key] = [];
    }
  }

  public async saveFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organizationDomain, finding } = args;
    const key = `${assessmentId}#${organizationDomain}`;

    if (!this.assessmentFindings[key]) {
      this.assessmentFindings[key] = [];
    }

    this.assessmentFindings[key].push(finding);
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
      AssessmentsRepositoryDynamoDB.decodeNextToken(nextToken);
    }
    return {
      assessments,
      nextToken,
    };
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organizationDomain } = args;
    return this.assessments[`${assessmentId}#${organizationDomain}`];
  }

  public async getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
      searchTerm,
      showHidden,
    } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const findings =
      this.assessmentFindings[key]
        ?.filter((finding) =>
          finding.bestPractices.includes(
            AssessmentsRepositoryDynamoDB.getBestPracticeCustomId({
              pillarId,
              questionId,
              bestPracticeId,
            })
          )
        )
        .filter((finding) => {
          if (!searchTerm) return true;
          return (
            finding.riskDetails?.includes(searchTerm) ||
            finding.statusDetail?.includes(searchTerm)
          );
        })
        .filter((finding) => (!showHidden ? !finding.hidden : true))
        .slice(0, limit) || [];
    return {
      findings,
      nextToken: undefined, // No pagination in this fake implementation
    };
  }

  public async getFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, findingId, organizationDomain } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    return this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
  }

  public async addFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    comment: FindingComment;
  }): Promise<void> {
    const { assessmentId, findingId, organizationDomain, comment } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
    if (finding) {
      if (!finding.comments) {
        finding.comments = [];
      }
      finding.comments.push(comment);
    }
  }

  public async deleteFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, commentId } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
    if (!finding) {
      throw new Error();
    }
    finding.comments = finding.comments?.filter(
      (comment) => comment.id !== commentId
    );
  }

  public async updateFindingComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
    commentBody: FindingCommentBody;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      findingId,
      commentId,
      commentBody,
    } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
    const comment = finding?.comments?.find(
      (comment) => comment.id === commentId
    );
    if (!comment) {
      throw new Error('Comment not found');
    }
    Object.assign(comment, commentBody);
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
      (pillar) => pillar.id === pillarId.toString()
    );
    const question = pillar?.questions.find(
      (question) => question.id === questionId.toString()
    );
    const bestPractice = question?.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString()
    );
    if (!bestPractice) {
      throw new Error();
    }
    bestPractice.checked =
      args.bestPracticeBody.checked ?? bestPractice.checked;
  }

  public async addBestPracticeFindings(args: {
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
      (pillar) => pillar.id === pillarId.toString()
    );
    const question = pillar?.questions.find(
      (question) => question.id === questionId.toString()
    );
    const bestPractice = question?.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString()
    );
    if (!bestPractice) {
      throw new Error();
    }
    for (const findingId of bestPracticeFindingIds) {
      bestPractice.results.add(findingId);
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
      (pillar) => pillar.id === pillarId.toString()
    );
    if (!pillar) {
      throw new Error();
    }
    pillar.disabled = pillarBody.disabled ?? pillar.disabled;
  }

  public async delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;
    delete this.assessments[`${assessmentId}#${organizationDomain}`];
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;
    delete this.assessmentFindings[`${assessmentId}#${organizationDomain}`];
  }

  private updateAssessmentBody<T extends keyof Assessment>(
    assessment: Assessment,
    field: T,
    value: Assessment[T]
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
        value as Assessment[keyof Assessment]
      );
    }
  }

  private updateFindingBody<T extends keyof Finding>(
    finding: Finding,
    field: T,
    value: Finding[T]
  ): void {
    finding[field] = value;
  }

  public async updateFinding(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, findingBody } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.assessmentFindings[key]?.find(
      (f) => f.id === findingId
    );
    for (const [field, value] of Object.entries(findingBody)) {
      // Only update fields that exist on the finding object
      this.updateFindingBody(
        finding as Finding,
        field as keyof Finding,
        value as Finding[keyof Finding]
      );
    }
  }

  private updateQuestionBody<T extends keyof QuestionBody>(
    question: QuestionBody,
    field: T,
    value: QuestionBody[T]
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
      (question) => question.id === questionId
    );
    for (const [key, value] of Object.entries(questionBody)) {
      this.updateQuestionBody(
        question as Question,
        key as keyof QuestionBody,
        value as QuestionBody[keyof QuestionBody]
      );
    }
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
}

export const tokenFakeAssessmentsRepository =
  createInjectionToken<FakeAssessmentsRepository>('FakeAssessmentsRepository', {
    useClass: FakeAssessmentsRepository,
  });
