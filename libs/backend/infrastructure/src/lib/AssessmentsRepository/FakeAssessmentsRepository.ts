import type { Assessment, BestPracticeBody, Finding } from '@backend/models';
import type {
  AssessmentsRepository,
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
} from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';
import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  EmptyUpdateBodyError,
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
      !this.assessments[key].findings?.find(
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
    findingId: string;
    organization: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, findingId, organization } = args;
    const key = `${assessmentId}#${organization}`;
    return this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
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
    const pillar = assessment.findings?.find(
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

  public async update(args: {
    assessmentId: string;
    organization: string;
    assessmentBody: {
      name?: string;
    };
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
      assessment[key as keyof Assessment] = value as any;
    }
  }
}

export const tokenFakeAssessmentsRepository =
  createInjectionToken<FakeAssessmentsRepository>('FakeAssessmentsRepository', {
    useClass: FakeAssessmentsRepository,
  });
