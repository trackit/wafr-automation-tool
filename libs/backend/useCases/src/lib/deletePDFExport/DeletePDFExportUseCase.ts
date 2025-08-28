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

import { ConflictError, NotFoundError } from '../Errors';

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

  public async deletePDFExport({
    assessmentId,
    fileExportId,
    user,
  }: DeletePDFExportUseCaseArgs): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organization: user.organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${user.organizationDomain}`
      );
    }

    const assessmentExport = assessment.fileExports?.[
      AssessmentFileExportType.PDF
    ]?.find((assessmentExport) => assessmentExport.id === fileExportId);
    if (!assessmentExport) {
      throw new NotFoundError(
        `PDF export with id ${fileExportId} not found for assessment ${assessmentId}`
      );
    }

    if (
      assessmentExport.status === AssessmentFileExportStatus.NOT_STARTED ||
      assessmentExport.status === AssessmentFileExportStatus.IN_PROGRESS
    ) {
      throw new ConflictError(
        `PDF export with id ${fileExportId} is not finished for assessment ${assessmentId}`
      );
    }

    if (assessmentExport.objectKey) {
      await this.objectsStorage.delete(assessmentExport.objectKey);
    }

    await this.assessmentsRepository.deleteFileExport({
      assessmentId,
      organization: user.organizationDomain,
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
