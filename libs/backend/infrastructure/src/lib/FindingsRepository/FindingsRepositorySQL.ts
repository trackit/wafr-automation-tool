import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import {
  Finding,
  FindingBody,
  FindingComment,
  FindingCommentBody,
} from '@backend/models';
import {
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
  FindingRepository,
} from '@backend/ports';
import { inject } from '@shared/di-container';
import { decodeNextToken, encodeNextToken } from '@shared/utils';

import {
  BestPracticeEntity,
  FindingCommentEntity,
  FindingEntity,
  FindingResourceEntity,
} from '../config/typeorm';
import { tokenLogger, tokenTypeORMClientManager } from '../infrastructure';
import { toDomainFinding } from './FindingsRepositorySQLMapping';

export class FindingsRepositorySQL implements FindingRepository {
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  private async repo<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    organization: string,
  ): Promise<Repository<T>> {
    if (!this.clientManager.isInitialized) {
      await this.clientManager.initialize();
    }
    const dataSource = await this.clientManager.getClient(organization);
    return dataSource.getRepository(entity);
  }

  public async save(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organizationDomain, finding } = args;
    const findingRepo = await this.repo(FindingEntity, organizationDomain);

    const { resources = [], ...findingData } = finding;

    await findingRepo.manager.transaction(async (trx) => {
      const trxFindingRepo = trx.getRepository(FindingEntity);
      const trxResourceRepo = trx.getRepository(FindingResourceEntity);

      const findingEntity = trxFindingRepo.create({
        ...findingData,
        assessmentId,
      });

      await trxFindingRepo.save(findingEntity);

      const findingResources = resources.map((resource) => {
        const resourceEntity = trxResourceRepo.create({
          ...resource,
          assessmentId,
          findingId: findingEntity.id,
        });
        return resourceEntity;
      });

      await trxResourceRepo.save(findingResources);

      this.logger.info(
        `Finding saved: ${finding.id} for assessment: ${assessmentId}`,
      );
    });
  }

  public async saveAll(args: {
    assessmentId: string;
    organizationDomain: string;
    findings: Finding[];
  }): Promise<void> {
    const { assessmentId, organizationDomain, findings } = args;

    const findingRepo = await this.repo(FindingEntity, organizationDomain);

    await findingRepo.manager.transaction(async (trx) => {
      const trxFindingRepo = trx.getRepository(FindingEntity);
      const trxResourceRepo = trx.getRepository(FindingResourceEntity);

      const findingEntities = findings.map((f) => {
        const { resources: _resources, ...findingData } = f;
        return trxFindingRepo.create({
          ...findingData,
          assessmentId,
        });
      });
      await trxFindingRepo.save(findingEntities);

      const allResourceEntities = findings.flatMap((finding) => {
        return finding.resources.map((r) =>
          trxResourceRepo.create({
            ...r,
            assessmentId,
            findingId: finding.id,
          }),
        );
      });
      await trxResourceRepo.save(allResourceEntities);

      this.logger.info(
        `${findingEntities.length} findings saved for assessment: ${assessmentId}`,
      );
    });
  }

  public async saveComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    comment: FindingComment;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, comment } = args;
    const repo = await this.repo(FindingCommentEntity, organizationDomain);

    const entity = repo.create({
      ...comment,
      findingId: findingId,
      assessmentId,
    });

    await repo.save(entity);
    this.logger.info(
      `Comment added to finding: ${findingId} for assessment: ${assessmentId}`,
    );
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, organizationDomain, findingId } = args;
    const repo = await this.repo(FindingEntity, organizationDomain);

    const entity = await repo.findOne({
      where: { id: findingId, assessmentId },
      relations: {
        comments: true,
        bestPractices: true,
        remediation: true,
        resources: true,
      },
    });
    return entity ? toDomainFinding(entity) : undefined;
  }

  public async getAll(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Finding[]> {
    const { assessmentId, organizationDomain } = args;
    const repo = await this.repo(FindingEntity, organizationDomain);

    const entities = await repo.find({
      where: { assessmentId },
      relations: {
        comments: true,
        bestPractices: true,
        remediation: true,
        resources: true,
      },
    });
    return entities.map((entity) => toDomainFinding(entity));
  }

  public async getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs,
  ): Promise<{ findings: Finding[]; nextToken?: string }> {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
      searchTerm = '',
      showHidden = false,
      nextToken,
    } = args;
    const repo = await this.repo(FindingEntity, organizationDomain);

    const decoded = decodeNextToken(nextToken) as
      | { offset?: number }
      | undefined;
    const offset = decoded?.offset ?? 0;

    const baseQb = repo
      .createQueryBuilder('f')
      .innerJoin('f.bestPractices', 'bp')
      .where('f.assessmentId = :assessmentId', { assessmentId })
      .andWhere(
        'bp.assessmentId = :assessmentId AND bp.id = :bestPracticeId AND bp.questionId = :questionId AND bp.pillarId = :pillarId',
        { assessmentId, bestPracticeId, questionId, pillarId },
      );

    if (!showHidden) {
      baseQb.andWhere('f.hidden = false');
    }
    if (searchTerm && searchTerm.trim()) {
      baseQb.andWhere(
        '(f.riskDetails ILIKE :term OR f.statusDetail ILIKE :term)',
        { term: `%${searchTerm}%` },
      );
    }

    const idRows = await baseQb
      .clone()
      .select('f.id', 'id')
      .distinct(true)
      .orderBy('f.id', 'ASC')
      .offset(offset)
      .limit(limit + 1)
      .getRawMany<{ id: string }>();
    const hasMore = idRows.length > limit;
    const ids = idRows.slice(0, limit).map((r) => r.id);
    if (ids.length === 0) {
      return { findings: [], nextToken: undefined };
    }

    const entities = await repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.remediation', 'rem')
      .leftJoinAndSelect('f.resources', 'res')
      .leftJoinAndSelect('f.comments', 'com')
      .leftJoinAndSelect('f.bestPractices', 'bp')
      .where('f.assessmentId = :assessmentId', { assessmentId })
      .andWhere('f.id IN (:...ids)', { ids })
      .orderBy('f.severity', 'ASC')
      .getMany();

    const nextTk = hasMore
      ? encodeNextToken({ offset: offset + ids.length })
      : undefined;

    return {
      findings: entities.map((e) => toDomainFinding(e)),
      nextToken: nextTk,
    };
  }

  public async deleteAll(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;
    const repo = await this.repo(FindingEntity, organizationDomain);

    await repo.delete({ assessmentId });
    this.logger.info(`Findings deleted for assessment: ${assessmentId}`);
  }

  public async deleteComment(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, commentId } = args;
    const repo = await this.repo(FindingCommentEntity, organizationDomain);

    await repo.delete({ id: commentId, findingId: findingId });
    this.logger.info(
      `Finding comment deleted: ${findingId} for assessment: ${assessmentId}`,
    );
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, findingId, findingBody } = args;
    const repo = await this.repo(FindingEntity, organizationDomain);

    await repo.update({ id: findingId, assessmentId }, findingBody);
    this.logger.info(
      `Finding successfully updated: ${findingId} for assessment: ${assessmentId}`,
    );
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
    const repo = await this.repo(FindingCommentEntity, organizationDomain);

    await repo.update({ id: commentId, findingId }, commentBody);
    this.logger.info(
      `Comment ${commentId} in finding ${findingId} for assessment ${assessmentId} updated successfully`,
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

    const bestPracticeRepo = await this.repo(
      BestPracticeEntity,
      organizationDomain,
    );

    const rows = [...bestPracticeFindingIds].map((findingId) => ({
      findingAssessmentId: assessmentId,
      findingId,
      bestPracticeAssessmentId: assessmentId,
      questionId,
      pillarId,
      bestPracticeId,
    }));

    await bestPracticeRepo.manager.transaction(async (trx) => {
      await trx
        .createQueryBuilder()
        .insert()
        .into('findingBestPractices')
        .values(rows)
        .orIgnore()
        .execute();
    });

    this.logger.info(
      `Best practice findings for best practice ${bestPracticeId} updated successfully`,
    );
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
    const repo = await this.repo(FindingEntity, organizationDomain);

    const qb = repo
      .createQueryBuilder('f')
      .innerJoin('f.bestPractices', 'bp')
      .where('f.assessmentId = :assessmentId', { assessmentId })
      .andWhere('bp.id = :bestPracticeId', { bestPracticeId })
      .andWhere('bp.questionId = :questionId', { questionId })
      .andWhere('bp.pillarId = :pillarId', { pillarId })
      .select('COUNT(f.id)', 'count');

    return parseInt((await qb.getRawOne())?.count) || 0;
  }
}
