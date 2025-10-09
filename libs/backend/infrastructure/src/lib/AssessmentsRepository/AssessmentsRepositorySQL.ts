import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  AssessmentFileExportType,
  AssessmentGraphData,
  BestPractice,
  BestPracticeBody,
  Pillar,
  PillarBody,
  Question,
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
import { toDomainAssessment } from './AssessmentsRepositorySQLMapping';

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
      fileExports: assessment.fileExports?.pdf?.map((fileExport) => ({
        ...fileExport,
        type: AssessmentFileExportType.PDF,
      })),
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
        question: {
          id: questionId,
          pillar: {
            id: pillarId,
            assessment: {
              id: assessmentId,
            },
          },
        },
      },
    });
    if (!entity) {
      throw new Error('Best practice not found');
    }
    const bestPracticeFindingArray = Array.from(bestPracticeFindingIds);
    entity.results = entity.results.concat(bestPracticeFindingArray);
    await repo.update(
      { id: bestPracticeId, questionId, pillarId, assessmentId },
      entity,
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

    const [entities, total] = await qb
      .leftJoinAndSelect('a.fileExports', 'fileExport')
      .getManyAndCount();
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
    const repo = await this.repo(AssessmentEntity, organizationDomain);
    const existing = await repo.findOne({
      where: { id: assessmentId },
      relations: [
        'pillars',
        'pillars.questions',
        'pillars.questions.bestPractices',
        'fileExports',
      ],
    });
    if (!existing) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }
    if (assessmentBody.name !== undefined) {
      existing.name = assessmentBody.name;
    }
    if (assessmentBody.rawGraphData !== undefined) {
      existing.rawGraphData = {
        ...existing.rawGraphData,
        ...Object.fromEntries(
          Object.entries(assessmentBody.rawGraphData ?? {}).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      } as Record<ScanningTool, AssessmentGraphData>;
    }
    if (assessmentBody.step !== undefined) {
      existing.step = assessmentBody.step;
    }
    if (assessmentBody.questionVersion !== undefined) {
      existing.questionVersion = assessmentBody.questionVersion;
    }
    if (assessmentBody.exportRegion !== undefined) {
      existing.exportRegion = assessmentBody.exportRegion;
    }
    if (assessmentBody.error !== undefined) {
      existing.error = assessmentBody.error;
    }
    if (assessmentBody.pillars !== undefined) {
      existing.pillars = this.mapPillarsToEntities(
        assessmentId,
        assessmentBody.pillars,
      );
    }

    await repo.save(existing);
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

  private mapPillarsToEntities(
    assessmentId: string,
    pillars: Pillar[],
  ): PillarEntity[] {
    return pillars.map((pillar) =>
      this.mapPillarToEntity(assessmentId, pillar),
    );
  }

  private mapPillarToEntity(
    assessmentId: string,
    pillar: Pillar,
  ): PillarEntity {
    const pillarEntity = new PillarEntity();
    pillarEntity.assessmentId = assessmentId;
    pillarEntity.id = pillar.id;
    pillarEntity.disabled = pillar.disabled;
    pillarEntity.label = pillar.label;
    pillarEntity.primaryId = pillar.primaryId;
    pillarEntity.questions = this.mapQuestionsToEntities(
      assessmentId,
      pillar.id,
      pillar.questions,
    );

    return pillarEntity;
  }

  private mapQuestionsToEntities(
    assessmentId: string,
    pillarId: string,
    questions: Question[],
  ): QuestionEntity[] {
    return questions.map((question) =>
      this.mapQuestionToEntity(assessmentId, pillarId, question),
    );
  }

  private mapQuestionToEntity(
    assessmentId: string,
    pillarId: string,
    question: Question,
  ): QuestionEntity {
    const questionEntity = new QuestionEntity();
    questionEntity.assessmentId = assessmentId;
    questionEntity.pillarId = pillarId;
    questionEntity.id = question.id;
    questionEntity.disabled = question.disabled;
    questionEntity.label = question.label;
    questionEntity.none = question.none;
    questionEntity.primaryId = question.primaryId;
    questionEntity.bestPractices = this.mapBestPracticesToEntities(
      assessmentId,
      pillarId,
      question.id,
      question.bestPractices,
    );

    return questionEntity;
  }

  private mapBestPracticesToEntities(
    assessmentId: string,
    pillarId: string,
    questionId: string,
    bestPractices: BestPractice[],
  ): BestPracticeEntity[] {
    return bestPractices.map((bp) =>
      this.mapBestPracticeToEntity(assessmentId, pillarId, questionId, bp),
    );
  }

  private mapBestPracticeToEntity(
    assessmentId: string,
    pillarId: string,
    questionId: string,
    bp: BestPractice,
  ): BestPracticeEntity {
    const bpEntity = new BestPracticeEntity();
    bpEntity.assessmentId = assessmentId;
    bpEntity.pillarId = pillarId;
    bpEntity.questionId = questionId;
    bpEntity.id = bp.id;
    bpEntity.description = bp.description;
    bpEntity.label = bp.label;
    bpEntity.primaryId = bp.primaryId;
    bpEntity.risk = bp.risk;
    bpEntity.checked = bp.checked;
    bpEntity.results = Array.from(bp.results);

    return bpEntity;
  }
}
