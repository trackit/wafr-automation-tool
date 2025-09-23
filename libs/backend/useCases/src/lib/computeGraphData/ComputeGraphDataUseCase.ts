import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import { AssessmentGraphDataMother } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';

export type ComputeGraphDataUseCaseArgs = {
  assessmentId: string;
  organizationDomain: string;
};

export interface ComputeGraphDataUseCase {
  computeGraphData(args: ComputeGraphDataUseCaseArgs): Promise<void>;
}

export class ComputeGraphDataUseCaseImpl implements ComputeGraphDataUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  private mergeCounters(
    a: Record<string, number>,
    b: Record<string, number>
  ): Record<string, number> {
    const result: Record<string, number> = { ...a };
    for (const key in b) {
      result[key] = (result[key] || 0) + b[key];
    }
    return result;
  }

  public async computeGraphData(
    args: ComputeGraphDataUseCaseArgs
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organizationDomain: args.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId: args.assessmentId,
        organizationDomain: args.organizationDomain,
      });
    }

    this.logger.info(
      `Computing graph data for assessment with id ${args.assessmentId}`
    );
    const assessmentGraphData = AssessmentGraphDataMother.basic().build();
    for (const scanningToolData of Object.values(assessment.rawGraphData)) {
      assessmentGraphData.regions = this.mergeCounters(
        assessmentGraphData.regions,
        scanningToolData.regions
      );
      assessmentGraphData.resourceTypes = this.mergeCounters(
        assessmentGraphData.resourceTypes,
        scanningToolData.resourceTypes
      );
      assessmentGraphData.severities = this.mergeCounters(
        assessmentGraphData.severities,
        scanningToolData.severities
      );
      assessmentGraphData.findings += scanningToolData.findings;
    }

    this.logger.info(
      `Updating graph data for assessment with id ${args.assessmentId}`
    );
    await this.assessmentsRepository.update({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      assessmentBody: {
        graphData: assessmentGraphData,
      },
    });
  }
}

export const tokenComputeGraphDataUseCase =
  createInjectionToken<ComputeGraphDataUseCase>('ComputeGraphDataUseCase', {
    useClass: ComputeGraphDataUseCaseImpl,
  });
