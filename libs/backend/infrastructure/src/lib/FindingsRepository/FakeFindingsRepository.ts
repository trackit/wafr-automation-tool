import type {
  Finding,
  FindingBody,
  FindingComment,
  FindingCommentBody,
} from '@backend/models';
import type {
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
  FindingRepository,
} from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';
import { getBestPracticeCustomId } from '@shared/utils';

export class FakeFindingsRepository implements FindingRepository {
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
    return this.findings[key];
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
    const key = `${assessmentId}#${organizationDomain}`;
    const findings =
      this.findings[key]
        ?.filter((finding) =>
          finding.bestPractices.includes(
            getBestPracticeCustomId({
              pillarId,
              questionId,
              bestPracticeId,
            }),
          ),
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
}

export const tokenFakeFindingsRepository =
  createInjectionToken<FakeFindingsRepository>('FakeFindingsRepository', {
    useClass: FakeFindingsRepository,
  });
