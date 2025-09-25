import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenObjectsStorage,
} from '@backend/infrastructure';
import {
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  User,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentFileExportNotFinishedError,
  AssessmentFileExportNotFoundError,
  AssessmentNotFoundError,
} from '../../errors';

export type DeletePDFExportUseCaseArgs = {
  assessmentId: string;
  fileExportId: string;
  user: User;
};

export interface DeletePDFExportUseCase {
  deletePDFExport(args: DeletePDFExportUseCaseArgs): Promise<void>;
}

export class DeletePDFExportUseCaseImpl implements DeletePDFExportUseCase {
  private readonly logger = inject(tokenLogger);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly objectsStorage = inject(tokenObjectsStorage);

  public async deletePDFExport(
    args: DeletePDFExportUseCaseArgs
  ): Promise<void> {
    const { assessmentId, fileExportId, user } = args;

    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain: user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain: user.organizationDomain,
      });
    }

    const assessmentExport = assessment.fileExports?.[
      AssessmentFileExportType.PDF
    ]?.find((assessmentExport) => assessmentExport.id === fileExportId);
    if (!assessmentExport) {
      throw new AssessmentFileExportNotFoundError({
        assessmentId,
        fileExportId,
        fileExportType: AssessmentFileExportType.PDF,
      });
    }

    if (
      assessmentExport.status === AssessmentFileExportStatus.NOT_STARTED ||
      assessmentExport.status === AssessmentFileExportStatus.IN_PROGRESS
    ) {
      throw new AssessmentFileExportNotFinishedError({
        assessmentId,
        fileExportId,
        fileExportType: AssessmentFileExportType.PDF,
      });
    }

    if (assessmentExport.objectKey) {
      await this.objectsStorage.delete(assessmentExport.objectKey);
    }

    await this.assessmentsRepository.deleteFileExport({
      assessmentId,
      organizationDomain: user.organizationDomain,
      type: AssessmentFileExportType.PDF,
      id: fileExportId,
    });
    this.logger.info(
      `PDF export with id ${fileExportId} deleted for assessment ${assessmentId}`
    );
  }
}

export const tokenDeletePDFExportUseCase =
  createInjectionToken<DeletePDFExportUseCase>('DeletePDFExportUseCase', {
    useClass: DeletePDFExportUseCaseImpl,
  });
