import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import type {
  Assessment,
  AssessmentBody,
  AssessmentFileExport,
  BestPracticeBody,
  Pillar,
  PillarBody,
  QuestionBody,
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
} from '../config/typeorm';
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

    const entity = repo.create(assessment);

    await repo.save(entity);
    this.logger.info(`Assessment saved: ${assessment.id}`);
  }

  public async savePillars(args: {
    assessmentId: string;
    organizationDomain: string;
    pillars: Pillar[];
  }): Promise<void> {
    const { assessmentId, organizationDomain, pillars } = args;
    const repo = await this.repo(PillarEntity, organizationDomain);

    const entities = pillars.map((pillar) => ({
      assessmentId,
      ...pillar,
    }));

    await repo.save(entities);
    this.logger.info(`Pillars saved for assessment ${assessmentId}`);
  }

  public async saveFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    data: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organizationDomain, data } = args;
    const repo = await this.repo(FileExportEntity, organizationDomain);

    const entity = repo.create({
      ...data,
      assessmentId,
    });

    await repo.save(entity);
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
    if (!entity) {
      return undefined;
    }
    return entity ? toDomainAssessment(entity, organizationDomain) : undefined;
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

  public async deleteFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    id: string;
  }): Promise<void> {
    const { assessmentId, organizationDomain, id } = args;
    const repo = await this.repo(FileExportEntity, organizationDomain);

    await repo.delete({ id, assessmentId });
    this.logger.info(
      `File export with id ${id} deleted successfully for assessment ${assessmentId}`,
    );
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, assessmentBody } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    await repo.update({ id: assessmentId }, assessmentBody);
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

  public async updateFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    data: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organizationDomain, data } = args;
    const repo = await this.repo(FileExportEntity, organizationDomain);

    await repo.update({ id: data.id, assessmentId }, { ...data });
    this.logger.info(
      `${data.type.toUpperCase()} file with id ${
        data.id
      } export updated successfully for assessment ${assessmentId}`,
    );
  }
}
