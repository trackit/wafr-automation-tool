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
  AssessmentFileExportFieldNotFoundError,
  AssessmentFileExportNotFinishedError,
  AssessmentFileExportNotFoundError,
  AssessmentNotFoundError,
} from '../../errors';

export type GeneratePDFExportURLUseCaseArgs = {
  assessmentId: string;
  fileExportId: string;
  user: User;
};

export interface GeneratePDFExportURLUseCase {
  generatePDFExportURL(args: GeneratePDFExportURLUseCaseArgs): Promise<string>;
}

export class GeneratePDFExportURLUseCaseImpl
  implements GeneratePDFExportURLUseCase
{
  private readonly logger = inject(tokenLogger);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly objectsStorage = inject(tokenObjectsStorage);

  public async generatePDFExportURL(
    args: GeneratePDFExportURLUseCaseArgs
  ): Promise<string> {
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

    const assessmentExport = assessment.fileExports?.find(
      (assessmentExport) => assessmentExport.id === fileExportId
    );
    if (!assessmentExport) {
      throw new AssessmentFileExportNotFoundError({
        assessmentId,
        fileExportId,
        fileExportType: AssessmentFileExportType.PDF,
      });
    }
    if (assessmentExport.status !== AssessmentFileExportStatus.COMPLETED) {
      throw new AssessmentFileExportNotFinishedError({
        assessmentId,
        fileExportId,
        fileExportType: AssessmentFileExportType.PDF,
      });
    }
    if (!assessmentExport.objectKey) {
      throw new AssessmentFileExportFieldNotFoundError({
        assessmentId,
        fileExportId,
        fileExportType: AssessmentFileExportType.PDF,
        fieldName: 'objectKey',
      });
    }

    const presignedURL = await this.objectsStorage.generatePresignedURL({
      key: assessmentExport.objectKey,
      expiresInSeconds: 60 * 60, // 1 hour
    });
    this.logger.info(
      `Successfully generated pre-signed URL for PDF export with id ${fileExportId} for assessment ${assessmentId}`
    );
    return presignedURL;
  }
}

export const tokenGeneratePDFExportURLUseCase =
  createInjectionToken<GeneratePDFExportURLUseCase>(
    'GeneratePDFExportURLUseCase',
    {
      useClass: GeneratePDFExportURLUseCaseImpl,
    }
  );
