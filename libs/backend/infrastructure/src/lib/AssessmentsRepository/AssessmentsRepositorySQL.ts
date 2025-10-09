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

import { tokenLogger } from '../Logger';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';

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
    throw new Error('Method not implemented.');
  }

  public async saveBestPracticeFindings(args: {
    assessmentId: string;
    organizationDomain: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async get(args: {
    assessmentId: string;
    organizationDomain: string;
  }): Promise<Assessment | undefined> {
    throw new Error('Method not implemented.');
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
    throw new Error('Method not implemented.');
  }

  public async updateFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    data: AssessmentFileExport;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async deleteFileExport(args: {
    assessmentId: string;
    organizationDomain: string;
    type: AssessmentFileExportType;
    id: string;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
