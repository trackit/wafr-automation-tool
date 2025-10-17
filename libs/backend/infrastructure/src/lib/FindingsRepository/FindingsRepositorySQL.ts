import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import {
  Finding,
  FindingBody,
  FindingComment,
  FindingCommentBody,
  SeverityType,
} from '@backend/models';
import {
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
  FindingRepository,
} from '@backend/ports';
import { inject } from '@shared/di-container';
import {
  decodeNextToken,
  encodeNextToken,
  getBestPracticeCustomId,
} from '@shared/utils';

import {
  BestPracticeEntity,
  FindingCommentEntity,
  FindingEntity,
  FindingResourceEntity,
} from '../config/typeorm';
import { tokenLogger, tokenTypeORMClientManager } from '../infrastructure';
import { toDomainFinding } from './FindingsRepositorySQLMapping';

type BestPracticeDescriptor = {
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
};

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

  private async getBestPracticeEntities(
    repo: Repository<BestPracticeEntity>,
    assessmentId: string,
    descriptors: BestPracticeDescriptor[],
  ): Promise<BestPracticeEntity[]> {
    if (!descriptors.length) {
      return [];
    }

    const found = await repo.find({
      where: descriptors.map(({ pillarId, questionId, bestPracticeId }) => ({
        id: bestPracticeId,
        assessmentId,
        pillarId,
        questionId,
      })),
    });

    return descriptors.map((descriptor) => {
      const { pillarId, questionId, bestPracticeId } = descriptor;
      const entity = found.find(
        (candidate) =>
          candidate.id === bestPracticeId &&
          candidate.pillarId === pillarId &&
          candidate.questionId === questionId,
      );
      if (!entity) {
        const key = getBestPracticeCustomId(descriptor);
        throw new Error(
          `Best practice ${key} not found in assessment ${assessmentId}`,
        );
      }
      return entity;
    });
  }

  private async createFindingEntities(
    repositories: {
      finding: Repository<FindingEntity>;
      resource: Repository<FindingResourceEntity>;
      bestPractice: Repository<BestPracticeEntity>;
    },
    assessmentId: string,
    finding: Finding,
  ): Promise<{
    findingEntity: FindingEntity;
    resourceEntities: FindingResourceEntity[];
  }> {
    const { resources = [], bestPractices, ...findingData } = finding;

    const descriptors = bestPractices
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [pillarId, questionId, bestPracticeId] = s.split('#');
        return { pillarId, questionId, bestPracticeId };
      });
    const bestPracticesEntities = await this.getBestPracticeEntities(
      repositories.bestPractice,
      assessmentId,
      descriptors,
    );

    const findingEntity = repositories.finding.create({
      ...findingData,
      bestPractices: bestPracticesEntities,
      eventCode: findingData.eventCode ?? '',
      riskDetails: findingData.riskDetails ?? '',
      statusCode: findingData.statusCode ?? '',
      statusDetail: findingData.statusDetail ?? '',
      severity: findingData.severity ?? SeverityType.Unknown,
      comments: findingData.comments ?? [],
      assessmentId,
    });
    const resourceEntities = resources.map((resource) =>
      repositories.resource.create({
        ...resource,
        assessmentId,
        findingId: findingEntity.id,
      }),
    );
    return { findingEntity, resourceEntities };
  }

  public async save(args: {
    assessmentId: string;
    organizationDomain: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organizationDomain, finding } = args;
    const findingRepo = await this.repo(FindingEntity, organizationDomain);

    await findingRepo.manager.transaction(async (trx) => {
      const trxFindingRepo = trx.getRepository(FindingEntity);
      const trxResourceRepo = trx.getRepository(FindingResourceEntity);
      const trxBestPracticeRepo = trx.getRepository(BestPracticeEntity);

      const { findingEntity, resourceEntities } =
        await this.createFindingEntities(
          {
            finding: trxFindingRepo,
            resource: trxResourceRepo,
            bestPractice: trxBestPracticeRepo,
          },
          assessmentId,
          finding,
        );
      await trxFindingRepo.save(findingEntity);
      if (resourceEntities.length) {
        await trxResourceRepo.save(resourceEntities);
      }
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
      const trxBestPracticeRepo = trx.getRepository(BestPracticeEntity);

      const preparedFindings = await Promise.all(
        findings.map((f) =>
          this.createFindingEntities(
            {
              finding: trxFindingRepo,
              resource: trxResourceRepo,
              bestPractice: trxBestPracticeRepo,
            },
            assessmentId,
            f,
          ),
        ),
      );
      const findingEntities = preparedFindings.map(
        ({ findingEntity }) => findingEntity,
      );
      await trxFindingRepo.save(findingEntities);

      const allResourceEntities = preparedFindings.flatMap(
        ({ resourceEntities }) => resourceEntities,
      );
      if (allResourceEntities.length) {
        await trxResourceRepo.save(allResourceEntities);
      }

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
}
