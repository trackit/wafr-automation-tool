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
  type AssessmentVersion,
  type AssessmentVersionBody,
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
  AssessmentVersionEntity,
  BestPracticeEntity,
  BillingInformationEntity,
  FileExportEntity,
  PillarEntity,
  QuestionEntity,
} from '../infrastructure';
import { tokenLogger } from '../Logger';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import {
  toDomainAssessmentVersion,
  toDomainAssessmentWithVersion,
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
    version?: number;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organizationDomain, version } = args;

    const assessmentRepo = await this.repo(
      AssessmentEntity,
      organizationDomain,
    );
    const assessmentEntity = await assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['fileExports', 'billingInformation'],
    });

    if (!assessmentEntity) return undefined;

    const assessmentVersionEntity = await this.getVersionEntity({
      assessmentId,
      version: version ?? assessmentEntity.latestVersionNumber,
      organizationDomain,
    });

    if (!assessmentVersionEntity) {
      this.logger.error(
        `Version ${version} not found for assessment ${assessmentId}`,
      );
      return undefined;
    }

    return toDomainAssessmentWithVersion(
      assessmentEntity,
      assessmentVersionEntity,
      organizationDomain,
    );
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
      .leftJoinAndSelect('a.versions', 'v', 'v.version = a.latestVersionNumber')
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

    const items = entities.map((assessment) => {
      const latestVersion = assessment.versions?.[0];

      if (!latestVersion) {
        this.logger.warn(
          `Version ${assessment.latestVersionNumber} not found for assessment ${assessment.id}`,
        );
        throw new Error();
      }

      return toDomainAssessmentWithVersion(
        assessment,
        latestVersion,
        organizationDomain,
      );
    });

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
    version: number;
    pillarBody: PillarBody;
  }): Promise<void> {
    const { assessmentId, organizationDomain, pillarId, version, pillarBody } =
      args;
    const repo = await this.repo(PillarEntity, organizationDomain);

    await repo.update({ id: pillarId, assessmentId, version }, pillarBody);
    this.logger.info(
      `Pillar ${pillarId} updated successfully for assessment ${assessmentId}-${version}`,
    );
  }

  public async updateQuestion(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      version,
      pillarId,
      questionId,
      questionBody,
    } = args;
    const repo = await this.repo(QuestionEntity, organizationDomain);

    await repo.update(
      { id: questionId, pillarId, assessmentId, version },
      questionBody,
    );
    this.logger.info(
      `Question ${questionId} in pillar ${pillarId} in assessment ${assessmentId}-${version} for organizationDomain ${organizationDomain} updated successfully`,
    );
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organizationDomain: string;
    version: number;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void> {
    const {
      assessmentId,
      organizationDomain,
      version,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeBody,
    } = args;
    const repo = await this.repo(BestPracticeEntity, organizationDomain);

    await repo.update(
      { id: bestPracticeId, questionId, pillarId, assessmentId, version },
      bestPracticeBody,
    );
    this.logger.info(
      `Best practice ${bestPracticeId} updated successfully for assessment ${assessmentId}-${version}`,
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

  public async createVersion(args: {
    assessmentVersion: AssessmentVersion;
    organizationDomain: string;
  }): Promise<void> {
    const { assessmentVersion, organizationDomain } = args;
    const repo = await this.repo(AssessmentVersionEntity, organizationDomain);

    const entity = repo.create(assessmentVersion);

    await repo.save(entity);
    this.logger.info(
      `Version ${assessmentVersion.version} created for assessment ${assessmentVersion.assessmentId}`,
    );
  }

  public async updateVersion(args: {
    assessmentId: string;
    version: number;
    organizationDomain: string;
    assessmentVersionBody: AssessmentVersionBody;
  }): Promise<void> {
    const { assessmentId, version, organizationDomain, assessmentVersionBody } =
      args;
    const repo = await this.repo(AssessmentVersionEntity, organizationDomain);

    await repo.update({ assessmentId, version }, assessmentVersionBody);

    this.logger.info(
      `Version ${version} updated for assessment ${assessmentId}`,
    );
  }

  public async getVersion(args: {
    assessmentId: string;
    version: number;
    organizationDomain: string;
  }): Promise<AssessmentVersion | undefined> {
    const entity = await this.getVersionEntity(args);
    return entity ? toDomainAssessmentVersion(entity) : undefined;
  }

  private async getVersionEntity(args: {
    assessmentId: string;
    version: number;
    organizationDomain: string;
  }): Promise<AssessmentVersionEntity | null> {
    const { assessmentId, version, organizationDomain } = args;
    const repo = await this.repo(AssessmentVersionEntity, organizationDomain);

    return repo.findOne({
      where: { assessmentId, version },
      relations: {
        pillars: {
          questions: {
            bestPractices: true,
          },
        },
      },
    });
  }
}
