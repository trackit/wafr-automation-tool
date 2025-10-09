import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

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

import {
  AssessmentEntity,
  BestPracticeEntity,
  FileExportEntity,
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
    throw new Error('Method not implemented.');
  }

  public async delete(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async update(args: {
    assessmentId: string;
    organizationDomain: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async updatePillar(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async updateQuestion(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void> {
    throw new Error('Method not implemented.');
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
}
