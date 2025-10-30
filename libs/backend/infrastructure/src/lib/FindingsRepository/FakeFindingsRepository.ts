import {
  type BestPractice,
  type Finding,
  type FindingBody,
  type FindingComment,
  type FindingCommentBody,
} from '@backend/models';
import type {
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
  FindingRepository,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenFakeAssessmentsRepository } from '../AssessmentsRepository';

export class FakeFindingsRepository implements FindingRepository {
  private fakeAssessmentsRepository = inject(tokenFakeAssessmentsRepository);
  public findings: Record<string, Finding[]> = {};

  public async save(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organizationDomain, finding } = args;
    const key = `${assessmentId}#${organizationDomain}`;

    if (!this.findings[key]) {
      this.findings[key] = [];
    }

    this.findings[key].push(finding);
  }

  public async saveAll(args: {
    assessmentId: string;
    organizationDomain: string;
    findings: Finding[];
  }): Promise<void> {
    const { assessmentId, organizationDomain, findings } = args;
    for (const finding of findings) {
      await this.save({ assessmentId, organizationDomain, finding });
    }
  }

  public async saveComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    comment: FindingComment;
  }): Promise<void> {
    const { assessmentId, findingId, organizationDomain, comment } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.findings[key]?.find(
      (finding) => finding.id === findingId,
    );
    if (finding) {
      if (!finding.comments) {
        finding.comments = [];
      }
      finding.comments.push(comment);
    }
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, findingId, organizationDomain } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    return this.findings[key]?.find((finding) => finding.id === findingId);
  }

  public async getAll(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Finding[]> {
    const { assessmentId, organizationDomain } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    return this.findings[key] ?? [];
  }

  public async getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs,
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

    const assessment = await this.fakeAssessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    const bestPractice = assessment?.pillars
      ?.find((pillar) => pillar.id === pillarId)
      ?.questions?.find((question) => question.id === questionId)
      ?.bestPractices?.find((bp) => bp.id === bestPracticeId);
    if (!bestPractice) {
      throw new Error();
    }

    const key = `${assessmentId}#${organizationDomain}`;
    const findings =
      this.findings[key]
        ?.filter((finding) => {
          return finding.bestPractices.some((bp) => bp?.id === bestPracticeId);
        })
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

  public async deleteAll(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;
    delete this.findings[`${assessmentId}#${organizationDomain}`];
  }

  public async deleteComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, commentId } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.findings[key]?.find(
      (finding) => finding.id === findingId,
    );
    if (!finding) {
      throw new Error();
    }
    finding.comments = finding.comments?.filter(
      (comment) => comment.id !== commentId,
    );
  }

  private updateBody<T extends keyof Finding>(
    finding: Finding,
    field: T,
    value: Finding[T],
  ): void {
    finding[field] = value;
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, findingBody } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const finding = this.findings[key]?.find((f) => f.id === findingId);
    for (const [field, value] of Object.entries(findingBody)) {
      // Only update fields that exist on the finding object
      this.updateBody(
        finding as Finding,
        field as keyof Finding,
        value as Finding[keyof Finding],
      );
    }
  }

  public async updateComment(args: {
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
    const finding = this.findings[key]?.find(
      (finding) => finding.id === findingId,
    );
    const comment = finding?.comments?.find(
      (comment) => comment.id === commentId,
    );
    if (!comment) {
      throw new Error('Comment not found');
    }
    Object.assign(comment, commentBody);
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

    if (!bestPracticeFindingIds || bestPracticeFindingIds.size === 0) return;

    const key = `${assessmentId}#${organizationDomain}`;
    const store = this.findings[key];
    if (!store || store.length === 0) return;

    const assessment = await this.fakeAssessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    const pillar = assessment?.pillars?.find(
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
      const finding = await this.get({
        assessmentId,
        organizationDomain,
        findingId,
      });
      if (!finding) {
        throw new Error();
      }
      if (!finding.bestPractices) {
        finding.bestPractices = [];
      }
      finding.bestPractices.push(bestPractice);
      if (
        !finding.bestPractices.some(
          (bp: BestPractice) => bp.id === bestPracticeId,
        )
      ) {
        finding.bestPractices.push(bestPractice);
      }
    }
  }
  public async countBestPracticeFindings(_args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): Promise<number> {
    throw new Error('Method not implemented.');
  }
}

export const tokenFakeFindingsRepository =
  createInjectionToken<FakeFindingsRepository>('FakeFindingsRepository', {
    useClass: FakeFindingsRepository,
  });
