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
import type {
  AssessmentsRepository,
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
} from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';
import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  EmptyUpdateBodyError,
  FindingNotFoundError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../Errors';
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
    organization: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organization, finding } = args;
    const key = `${assessmentId}#${organization}`;

    if (!this.assessmentFindings[key]) {
      this.assessmentFindings[key] = [];
    }

    this.assessmentFindings[key].push(finding);
  }

  public async getAll(args: {
    organization: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{
    assessments: Assessment[];
    nextToken?: string;
  }> {
    const { organization, limit, search, nextToken } = args;
    const assessments = Object.values(this.assessments)
      .filter((assessment) => assessment.organization === organization)
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
    organization: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organization } = args;
    return this.assessments[`${assessmentId}#${organization}`];
  }

  public async getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): Promise<{
    findings: Finding[];
    nextToken?: string;
  }> {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
      searchTerm,
      showHidden,
    } = args;
    const key = `${assessmentId}#${organization}`;
    if (
      !this.assessmentFindings[key] ||
      !this.assessments[key].pillars?.find(
        (pillar) =>
          pillar.id === pillarId &&
          pillar.questions.find(
            (question) =>
              question.id === questionId &&
              question.bestPractices.find((bp) => bp.id === bestPracticeId)
          )
      )
    ) {
      throw new BestPracticeNotFoundError({
        assessmentId,
        organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }
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
    organization: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, findingId, organization } = args;
    const key = `${assessmentId}#${organization}`;
    return this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
  }

  public async addFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    comment: FindingComment;
  }): Promise<void> {
    const { assessmentId, findingId, organization, comment } = args;
    const key = `${assessmentId}#${organization}`;
    const finding = this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
    if (finding) {
      if (!finding.comments) {
        finding.comments = {};
      }
      finding.comments[comment.id] = comment;
    }
  }

  public async deleteFindingComment(args: {
    assessmentId: string;
    organization: string;
    finding: Finding;
    commentId: string;
  }): Promise<void> {
    const { finding, commentId } = args;
    delete finding.comments?.[commentId];
  }

  public async updateFindingComment(args: {
    assessmentId: string;
    organization: string;
    finding: Finding;
    commentId: string;
    commentBody: FindingCommentBody;
  }): Promise<void> {
    const { finding, commentId, commentBody } = args;
    if (!finding.comments) {
      finding.comments = {};
    }
    finding.comments[commentId] = {
      ...finding.comments[commentId],
      ...commentBody,
    };
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void> {
    const { assessmentId, organization, pillarId, questionId, bestPracticeId } =
      args;
    const assessment = this.assessments[`${assessmentId}#${organization}`];
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: assessmentId,
        organization,
      });
    }
    if (Object.keys(args.bestPracticeBody).length === 0) {
      throw new EmptyUpdateBodyError();
    }
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
      });
    }
    const question = pillar.questions.find(
      (question) => question.id === questionId.toString()
    );
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
        questionId,
      });
    }
    const bestPractice = question.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString()
    );
    if (!bestPractice) {
      throw new BestPracticeNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }
    bestPractice.checked =
      args.bestPracticeBody.checked ?? bestPractice.checked;
  }

  public async addBestPracticeFindings(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }): Promise<void> {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeFindingIds,
    } = args;
    const assessment = this.assessments[`${assessmentId}#${organization}`];
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: assessmentId,
        organization,
      });
    }
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
      });
    }
    const question = pillar.questions.find(
      (question) => question.id === questionId.toString()
    );
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
        questionId,
      });
    }
    const bestPractice = question.bestPractices.find(
      (bestPractice) => bestPractice.id === bestPracticeId.toString()
    );
    if (!bestPractice) {
      throw new BestPracticeNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }
    for (const findingId of bestPracticeFindingIds) {
      bestPractice.results.add(findingId);
    }
  }

  public async updatePillar(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void> {
    const { assessmentId, organization, pillarId, pillarBody } = args;
    const assessment = this.assessments[`${assessmentId}#${organization}`];
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: assessmentId,
        organization,
      });
    }
    if (Object.keys(pillarBody).length === 0) {
      throw new EmptyUpdateBodyError();
    }
    const pillar = assessment.pillars?.find(
      (pillar) => pillar.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessmentId,
        organization,
        pillarId,
      });
    }
    pillar.disabled = pillarBody.disabled ?? pillar.disabled;
  }

  public async delete(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    delete this.assessments[`${assessmentId}#${organization}`];
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    delete this.assessmentFindings[`${assessmentId}#${organization}`];
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
    organization: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organization, assessmentBody } = args;
    const assessmentKey = `${assessmentId}#${organization}`;
    if (!this.assessments[assessmentKey]) {
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    if (Object.keys(assessmentBody).length === 0) {
      throw new EmptyUpdateBodyError();
    }
    const assessment = this.assessments[assessmentKey];
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
    organization: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organization, findingId, findingBody } = args;
    const key = `${assessmentId}#${organization}`;
    const finding = this.assessmentFindings[key]?.find(
      (f) => f.id === findingId
    );
    if (!finding) {
      throw new FindingNotFoundError({
        assessmentId,
        organization,
        findingId,
      });
    }
    if (Object.keys(findingBody).length === 0) {
      throw new EmptyUpdateBodyError();
    }
    for (const [field, value] of Object.entries(findingBody)) {
      // Only update fields that exist on the finding object
      this.updateFindingBody(
        finding,
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
    organization: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    const { assessmentId, organization, pillarId, questionId, questionBody } =
      args;
    const assessmentKey = `${assessmentId}#${organization}`;
    if (!this.assessments[assessmentKey]) {
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    if (Object.keys(questionBody).length === 0) {
      throw new EmptyUpdateBodyError();
    }
    const assessment = this.assessments[assessmentKey];
    const pillar = assessment.pillars?.find((pillar) => pillar.id === pillarId);
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId,
        organization,
        pillarId,
      });
    }
    const question = pillar.questions.find(
      (question) => question.id === questionId
    );
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId,
        organization,
        pillarId,
        questionId,
      });
    }
    for (const [key, value] of Object.entries(questionBody)) {
      this.updateQuestionBody(
        question,
        key as keyof QuestionBody,
        value as QuestionBody[keyof QuestionBody]
      );
    }
  }

  public async updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organization: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void> {
    const { assessmentId, organization, scanningTool, graphData } = args;
    const assessmentKey = `${assessmentId}#${organization}`;
    if (!this.assessments[assessmentKey]) {
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    const assessment = this.assessments[assessmentKey];
    if (!assessment.rawGraphData) {
      assessment.rawGraphData = {};
    }
    assessment.rawGraphData[scanningTool] = graphData;
  }
}

export const tokenFakeAssessmentsRepository =
  createInjectionToken<FakeAssessmentsRepository>('FakeAssessmentsRepository', {
    useClass: FakeAssessmentsRepository,
  });
