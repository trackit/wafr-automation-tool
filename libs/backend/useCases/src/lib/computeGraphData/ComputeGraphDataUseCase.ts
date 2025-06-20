import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import { AssessmentGraphDatasMother, ScanningTool } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';

export type ComputeGraphDataUseCaseArgs = {
  assessmentId: string;
  organization: string;
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
      organization: args.organization,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.organization}`
      );
    }

    this.logger.info(
      `Computing graph data for assessment with id ${args.assessmentId}`
    );
    const assessmentGraphData = AssessmentGraphDatasMother.basic().build();
    for (const scanningToolData of Object.values(assessment.rawGraphDatas)) {
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
      organization: assessment.organization,
      assessmentBody: {
        graphDatas: assessmentGraphData,
      },
    });
  }
}

export const tokenComputeGraphDataUseCase =
  createInjectionToken<ComputeGraphDataUseCase>('ComputeGraphDataUseCase', {
    useClass: ComputeGraphDataUseCaseImpl,
  });
