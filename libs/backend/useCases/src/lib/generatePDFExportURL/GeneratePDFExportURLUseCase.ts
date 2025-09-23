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

import { ConflictError, NoContentError, NotFoundError } from '../Errors';

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

  public async generatePDFExportURL({
    assessmentId,
    fileExportId,
    user,
  }: GeneratePDFExportURLUseCaseArgs): Promise<string> {
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

    if (assessmentExport.status !== AssessmentFileExportStatus.COMPLETED) {
      throw new ConflictError(
        `PDF export with id ${fileExportId} is not completed for assessment ${assessmentId}`
      );
    }

    if (!assessmentExport.objectKey) {
      throw new NoContentError(
        `PDF export with id ${fileExportId} has no object key for assessment ${assessmentId}`
      );
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
