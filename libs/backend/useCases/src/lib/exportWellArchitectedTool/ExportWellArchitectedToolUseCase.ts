import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenWellArchitectedToolService,
} from '@backend/infrastructure';
import { AssessmentStep, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ConflictError, NoContentError, NotFoundError } from '../Errors';

export type ExportWellArchitectedToolUseCaseArgs = {
  assessmentId: string;
  user: User;
};

export interface ExportWellArchitectedToolUseCase {
  exportAssessment(args: ExportWellArchitectedToolUseCaseArgs): Promise<void>;
}

export class ExportWellArchitectedToolUseCaseImpl
  implements ExportWellArchitectedToolUseCase
{
  private readonly logger = inject(tokenLogger);
  private readonly wellArchitectedToolService = inject(
    tokenWellArchitectedToolService
  );
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);

  public async exportAssessment(
    args: ExportWellArchitectedToolUseCaseArgs
  ): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId: args.assessmentId,
      organization: args.user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${args.assessmentId} not found for organization ${args.user.organizationDomain}`
      );
    }
    if (!assessment.findings || assessment.step !== AssessmentStep.FINISHED) {
      throw new ConflictError(
        `Assessment with id ${assessment.id} is not finished`
      );
    }
    if (assessment.findings.length === 0) {
      throw new NoContentError(
        `Assessment with id ${assessment.id} has no findings`
      );
    }
    await this.wellArchitectedToolService.exportAssessment(
      assessment,
      args.user
    );
    this.logger.info('Export Assessment to Well Architected Tool', {
      assessmentId: assessment.id,
      organization: args.user.organizationDomain,
    });
  }
}

export const tokenGetAllAssessmentsUseCase =
  createInjectionToken<ExportWellArchitectedToolUseCase>(
    'ExportWellArchitectedToolUseCase',
    {
      useClass: ExportWellArchitectedToolUseCaseImpl,
    }
  );
