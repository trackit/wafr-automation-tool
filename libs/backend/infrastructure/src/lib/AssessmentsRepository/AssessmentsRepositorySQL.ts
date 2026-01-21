import {
  Between,
  type EntityTarget,
  IsNull,
  Not,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';

import {
  type Assessment,
  type AssessmentBody,
  type AssessmentFileExport,
  type BestPracticeBody,
  type BillingInformation,
  type PillarBody,
  type QuestionBody,
} from '@backend/models';
import { type AssessmentsRepository } from '@backend/ports';
import { inject } from '@shared/di-container';
import { decodeNextToken, encodeNextToken } from '@shared/utils';

import {
  AssessmentEntity,
  BestPracticeEntity,
  BillingInformationEntity,
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
      billingInformation: assessment.billingInformation
        ? {
            ...assessment.billingInformation,
            assessmentId: assessment.id,
          }
        : undefined,
    });
    await repo.save(entity);
    this.logger.info(`Assessment ${assessment.id} saved`);
  }

  public async saveFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    fileExport: AssessmentFileExport;
  }): Promise<void> {
    const { assessmentId, organizationDomain, fileExport } = args;
    const repo = await this.repo(FileExportEntity, organizationDomain);

    const entity = repo.create({
      ...fileExport,
      assessmentId,
    });

    await repo.save(entity);
    this.logger.info(`File exports saved for assessment ${assessmentId}`);
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
        billingInformation: true,
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
    folder?: string;
  }): Promise<{ assessments: Assessment[]; nextToken?: string }> {
    const { organizationDomain, limit = 20, search, nextToken, folder } = args;
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

    if (folder !== undefined) {
      if (folder === '') {
        qb.andWhere('a.folder IS NULL');
      } else {
        qb.andWhere('a.folder = :folder', { folder });
      }
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

    await repo.update({ id: data.id, assessmentId }, data);
    this.logger.info(
      `${data.type.toUpperCase()} file with id ${
        data.id
      } export updated successfully for assessment ${assessmentId}`,
    );
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

  public async getOpportunitiesByYear(args: {
    organizationDomain: string;
    year: number;
  }): Promise<Array<{ id: string; createdAt: Date }>> {
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
      id: a.opportunityId!,
      createdAt: a.opportunityCreatedAt!,
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

  public async countAssessmentsByFolder(args: {
    organizationDomain: string;
  }): Promise<Record<string, number>> {
    const { organizationDomain } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    const results = await repo
      .createQueryBuilder('a')
      .select('COALESCE(a.folder, :empty)', 'folder')
      .addSelect('COUNT(*)', 'count')
      .setParameter('empty', '')
      .groupBy('a.folder')
      .getRawMany<{ folder: string; count: string }>();

    const counts: Record<string, number> = {};
    for (const row of results) {
      counts[row.folder] = parseInt(row.count, 10);
    }
    return counts;
  }

  public async saveBillingInformation(args: {
    assessmentId: string;
    organizationDomain: string;
    billingInformation: BillingInformation;
  }): Promise<void> {
    const { assessmentId, organizationDomain, billingInformation } = args;

    const repo = await this.repo(BillingInformationEntity, organizationDomain);
    const entity = repo.create({ ...billingInformation, assessmentId });

    await repo.save(entity);

    this.logger.info(
      `Billing information saved for assessment: ${assessmentId}`,
    );
  }

  public async updateAssessmentsByFolder(args: {
    organizationDomain: string;
    oldFolderName: string;
    newFolderName: string;
  }): Promise<void> {
    const { organizationDomain, oldFolderName, newFolderName } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    await repo.update({ folder: oldFolderName }, { folder: newFolderName });

    this.logger.info(
      `Updated assessments folder from "${oldFolderName}" to "${newFolderName}"`,
    );
  }

  public async clearAssessmentsFolder(args: {
    organizationDomain: string;
    folderName: string;
  }): Promise<void> {
    const { organizationDomain, folderName } = args;
    const repo = await this.repo(AssessmentEntity, organizationDomain);

    await repo
      .createQueryBuilder()
      .update(AssessmentEntity)
      .set({ folder: () => 'NULL' })
      .where('folder = :folderName', { folderName })
      .execute();

    this.logger.info(`Cleared folder "${folderName}" from assessments`);
  }
}
