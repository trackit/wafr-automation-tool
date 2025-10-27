import {
  Between,
  EntityTarget,
  IsNull,
  Not,
  ObjectLiteral,
  Repository,
} from 'typeorm';

import {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  AssessmentFileExportType,
  AssessmentGraphData,
  BestPracticeBody,
  PillarBody,
  QuestionBody,
  ScanningTool,
} from '@backend/models';
import { AssessmentsRepository } from '@backend/ports';
import { inject } from '@shared/di-container';
import { decodeNextToken, encodeNextToken } from '@shared/utils';

import {
  AssessmentEntity,
  BestPracticeEntity,
  FileExportEntity,
  PillarEntity,
  QuestionEntity,
} from '../infrastructure';
import { tokenLogger } from '../Logger';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import {
  mapFileExportsToEntities,
  mapPillarsToEntities,
  toDomainAssessment,
} from './AssessmentsRepositorySQLMapping';

export class AssessmentsRepositorySQL implements AssessmentsRepository {
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

  public async save(assessment: Assessment): Promise<void> {
    const repo = await this.repo(AssessmentEntity, assessment.organization);
    const entity = repo.create({
      ...assessment,
      pillars:
        assessment.pillars?.map((p) => ({
          ...p,
          questions: p.questions.map((q) => ({
            ...q,
            bestPractices: q.bestPractices.map((bp) => ({
              ...bp,
              results: bp.results ? Array.from(bp.results) : [],
            })),
          })),
        })) ?? [],
      fileExports: mapFileExportsToEntities(
        assessment.id,
        assessment.fileExports ?? {},
      ),
    });
    await repo.save(entity);
    this.logger.info(`Assessment ${assessment.id} saved`);
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
    const repo = await this.repo(BestPracticeEntity, organizationDomain);
    const entity = await repo.findOne({
      where: {
        id: bestPracticeId,
        questionId: questionId,
        pillarId: pillarId,
        assessmentId: assessmentId,
      },
    });
    if (!entity) {
      throw new Error('Best practice not found');
    }
    const updatedResults = entity.results.concat(
      Array.from(bestPracticeFindingIds),
    );
    entity.results = Array.from(new Set(updatedResults));
    await repo.update(
      { id: bestPracticeId, questionId, pillarId, assessmentId },
      { results: entity.results },
    );
    this.logger.info(
      `Best practice findings for best practice ${bestPracticeId} updated successfully`,
    );
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organizationDomain } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    const entity = await repo.findOne({
      where: { id: assessmentId },
      relations: {
        pillars: {
          questions: {
            bestPractices: true,
          },
        },
        fileExports: true,
      },
    });
    if (!entity) return undefined;
    return toDomainAssessment(entity, organizationDomain);
  }

  public async getAll(args: {
    organizationDomain: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{ assessments: Assessment[]; nextToken?: string }> {
    const { organizationDomain, limit = 20, search, nextToken } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    const decoded = decodeNextToken(nextToken) as
      | { offset?: number }
      | undefined;
    const offset = decoded?.offset ?? 0;

    const qb = repo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (search && search.trim()) {
      qb.andWhere(
        '(a.name ILIKE :term OR a.roleArn ILIKE :term OR a.id::text ILIKE :term)',
        { term: `%${search}%` },
      );
    }

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) =>
      toDomainAssessment(e, organizationDomain),
    );

    const nextOffset = offset + items.length;
    const nextTk =
      nextOffset < total ? encodeNextToken({ offset: nextOffset }) : undefined;

    return { assessments: items, nextToken: nextTk };
  }

  public async delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    await repo.delete({ id: assessmentId });
    this.logger.info(`Assessment deleted: ${assessmentId}`);
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, assessmentBody } = args;
    const assessmentRepo = await this.repo(
      AssessmentEntity,
      organizationDomain,
    );
    const existing = await assessmentRepo.findOne({
      where: { id: assessmentId },
    });
    if (!existing) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }
    const { pillars, fileExports, ...assessmentData } = assessmentBody;
    if (pillars) {
      const pillarRepo = await this.repo(PillarEntity, organizationDomain);
      await pillarRepo.delete({ assessmentId });
      const pillarEntities = mapPillarsToEntities(assessmentId, pillars);
      await pillarRepo.save(pillarEntities);
    }

    if (fileExports) {
      const fileExportRepo = await this.repo(
        FileExportEntity,
        organizationDomain,
      );
      const fileExportEntities = mapFileExportsToEntities(
        assessmentId,
        fileExports,
      );
      await fileExportRepo.delete({ assessmentId });
      await fileExportRepo.save(fileExportEntities);
    }
    await assessmentRepo.update({ id: assessmentId }, assessmentData);
    this.logger.info(`Assessment updated: ${assessmentId}`);
  }

  public async updatePillar(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, pillarId, pillarBody } = args;
    const repo = await this.repo(PillarEntity, organizationDomain);

    await repo.update({ id: pillarId, assessmentId }, pillarBody);
    this.logger.info(
      `Pillar ${pillarId} updated successfully for assessment ${assessmentId}`,
    );
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
    const repo = await this.repo(QuestionEntity, organizationDomain);

    await repo.update({ id: questionId, pillarId, assessmentId }, questionBody);
    this.logger.info(
      `Question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organizationDomain ${organizationDomain} updated successfully`,
    );
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
      bestPracticeBody,
    } = args;
    const repo = await this.repo(BestPracticeEntity, organizationDomain);

    await repo.update(
      { id: bestPracticeId, questionId, pillarId, assessmentId },
      bestPracticeBody,
    );
    this.logger.info(
      `Best practice ${bestPracticeId} updated successfully for assessment ${assessmentId}`,
    );
  }

  public async updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organizationDomain: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void> {
    const { assessmentId, organizationDomain, scanningTool, graphData } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);
    const assessment = await repo.findOne({ where: { id: assessmentId } });
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    await repo.update(
      { id: assessmentId },
      {
        rawGraphData: {
          ...assessment.rawGraphData,
          [scanningTool]: graphData,
        },
      },
    );
    this.logger.info(
      `Raw graph data for scanning tool ${scanningTool} updated successfully for assessment ${assessmentId}`,
    );
  }

  public async updateFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    data: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organizationDomain, type, data } = args;
    const repo = await this.repo(FileExportEntity, organizationDomain);

    const fileExport = await repo.findOne({
      where: { id: data.id, assessmentId },
    });
    if (!fileExport) {
      await repo.save({ ...data, assessmentId, type });
    } else {
      await repo.update({ id: data.id, assessmentId }, { ...data });
    }
    this.logger.info(
      `${type.toUpperCase()} file with id ${
        data.id
      } export updated successfully for assessment ${assessmentId}`,
    );
  }

  public async deleteFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    id: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, id } = args;
    const repo = await this.repo(FileExportEntity, organizationDomain);

    await repo.delete({ id, assessmentId });
    this.logger.info(
      `File export with id ${id} deleted successfully for assessment ${assessmentId}`,
    );
  }

  public async getOpportunitiesByYear(args: {
    organizationDomain: string;
    year: number;
  }): Promise<Array<{ opportunityId: string; opportunityCreatedAt: Date }>> {
    const { organizationDomain, year } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const assessments = await repo.find({
      select: ['opportunityId', 'opportunityCreatedAt'],
      where: {
        opportunityId: Not(IsNull()),
        opportunityCreatedAt: Between(startDate, endDate),
      },
      order: {
        opportunityCreatedAt: 'DESC',
      },
    });
    return assessments.map((a) => ({
      opportunityId: a.opportunityId!,
      opportunityCreatedAt: a.opportunityCreatedAt!,
    }));
  }

  public async countAssessmentsByYear(args: {
    organizationDomain: string;
    year: number;
  }): Promise<number> {
    const { organizationDomain, year } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    return repo.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
  }
}
