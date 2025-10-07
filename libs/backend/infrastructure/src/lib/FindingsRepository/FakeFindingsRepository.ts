import type {
  Finding,
  FindingAggregationFields,
  FindingAggregationResult,
  FindingBody,
  FindingComment,
  FindingCommentBody,
} from '@backend/models';
import type {
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
  FindingRepository,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenFakeAssessmentsRepository } from '../infrastructure';

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
    await Promise.all(
      findings.map((finding) =>
        this.save({ assessmentId, organizationDomain, finding }),
      ),
    );
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
    const key = `${assessmentId}#${organizationDomain}`;

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

    const findings =
      this.findings[key]
        ?.filter((finding) =>
          finding.bestPractices?.find((bp) => bp.id === bestPractice.id),
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

  private flattenAggregationFields(
    fields: Record<string, unknown>,
    prefix: string[] = [],
  ): string[][] {
    if (!fields) {
      return [];
    }

    return Object.entries(fields).flatMap(([key, value]) => {
      if (value === undefined || value === null) {
        return [];
      }
      if (value === true) {
        return [[...prefix, key]];
      }
      if (typeof value === 'object') {
        return this.flattenAggregationFields(value as Record<string, unknown>, [
          ...prefix,
          key,
        ]);
      }
      return [];
    });
  }

  private assignAggregationResult(
    target: Record<string, unknown>,
    path: string[],
    counts: Record<string, number>,
  ): void {
    const [lastKey] = path.slice(-1);
    if (!lastKey) {
      return;
    }

    const parent = path
      .slice(0, -1)
      .reduce<Record<string, unknown>>((acc, segment) => {
        if (!segment) {
          return acc;
        }
        if (!acc[segment] || typeof acc[segment] !== 'object') {
          acc[segment] = {};
        }
        return acc[segment] as Record<string, unknown>;
      }, target);

    parent[lastKey] = counts;
  }

  private countByPath(
    findings: Finding[],
    path: string[],
  ): Record<string, number> {
    if (path.length === 0) {
      return {};
    }

    return findings.reduce<Record<string, number>>((acc, finding) => {
      const values = this.extractValuesForPath(finding, path, 0);
      for (const value of values) {
        const key = this.normalizeAggregationKey(value);
        acc[key] = (acc[key] ?? 0) + 1;
      }
      return acc;
    }, {});
  }

  private extractValuesForPath(
    source: unknown,
    path: string[],
    depth: number,
  ): unknown[] {
    if (depth >= path.length) {
      return [source];
    }

    if (source === null || source === undefined) {
      return [];
    }

    if (Array.isArray(source)) {
      return source.flatMap((item) =>
        this.extractValuesForPath(item, path, depth),
      );
    }

    if (typeof source === 'object') {
      const segment = path[depth];
      const next = (source as Record<string, unknown>)[segment];
      return this.extractValuesForPath(next, path, depth + 1);
    }

    return [];
  }

  private normalizeAggregationKey(value: unknown): string {
    const raw = String(value ?? 'unknown').trim();
    if (!raw) {
      return 'unknown';
    }
    return raw.toLowerCase();
  }

  public async aggregateAll<TFields extends FindingAggregationFields>(args: {
    assessmentId: string;
    organizationDomain: string;
    fields: TFields;
  }): Promise<FindingAggregationResult<TFields>> {
    const { assessmentId, organizationDomain, fields } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const findings = this.findings[key] ?? [];

    const fieldPaths = this.flattenAggregationFields(
      fields as Record<string, unknown>,
    );
    if (fieldPaths.length === 0) {
      return {} as FindingAggregationResult<TFields>;
    }

    const aggregations: Record<string, unknown> = {};
    for (const path of fieldPaths) {
      const counts = this.countByPath(findings, path);
      this.assignAggregationResult(aggregations, path, counts);
    }

    return aggregations as FindingAggregationResult<TFields>;
  }

  public async countAll(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<number> {
    const { assessmentId, organizationDomain } = args;
    const key = `${assessmentId}#${organizationDomain}`;
    const findings = this.findings[key] ?? [];

    return findings.length;
  }

  public async countBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): Promise<number> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
    } = args;
    const key = `${assessmentId}#${organizationDomain}`;

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

    const findings = this.findings[key]?.filter((finding) =>
      finding.bestPractices?.find((bp) => bp.id === bestPractice.id),
    );
    return findings.length;
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
