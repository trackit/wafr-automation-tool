import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenObjectsStorage,
  tokenPDFService,
} from '@backend/infrastructure';
import {
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentStep,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { normalizeFilename } from '@shared/utils';

import { ConflictError, NoContentError, NotFoundError } from '../Errors';

export type ExportPDFUseCaseArgs = {
  assessmentId: string;
  organizationDomain: string;
  fileExportId: string;
};

export interface ExportPDFUseCase {
  exportPDF(args: ExportPDFUseCaseArgs): Promise<void>;
}

export class ExportPDFUseCaseImpl implements ExportPDFUseCase {
  private readonly logger = inject(tokenLogger);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly pdfService = inject(tokenPDFService);
  private readonly objectsStorage = inject(tokenObjectsStorage);

  public async exportPDF({
    assessmentId,
    organizationDomain,
    fileExportId,
  }: ExportPDFUseCaseArgs): Promise<void> {
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organization: organizationDomain,
    });
    if (!assessment) {
      throw new NotFoundError(
        `Assessment with id ${assessmentId} not found for organization ${organizationDomain}`
      );
    }
    if (!assessment.pillars || assessment.step !== AssessmentStep.FINISHED) {
      throw new ConflictError(
        `Assessment with id ${assessment.id} is not finished`
      );
    }
    if (assessment.pillars.length === 0) {
      throw new NoContentError(
        `Assessment with id ${assessment.id} has no findings`
      );
    }

    const assessmentExport = assessment.fileExports?.[
      AssessmentFileExportType.PDF
    ]?.find((assessmentExport) => assessmentExport.id === fileExportId);
    if (!assessmentExport) {
      throw new NotFoundError(
        `PDF export with id ${fileExportId} not found for assessment ${assessment.id}`
      );
    }

    assessmentExport.status = AssessmentFileExportStatus.IN_PROGRESS;
    await this.assessmentsRepository.updateFileExport({
      assessmentId: assessment.id,
      organization: assessment.organization,
      type: AssessmentFileExportType.PDF,
      data: assessmentExport,
    });

    try {
      const pdfFileContent = await this.pdfService.exportAssessment({
        assessment,
        versionName: assessmentExport.versionName,
      });
      const filename = normalizeFilename(
        `${assessment.name}_${assessmentExport.versionName}.pdf`
      );
      const objectKey = `assessments/${assessment.id}/exports/${filename}`;
      await this.objectsStorage.put({
        key: objectKey,
        body: pdfFileContent,
      });

      assessmentExport.status = AssessmentFileExportStatus.COMPLETED;
      assessmentExport.objectKey = objectKey;
      this.logger.info(
        `Export for assessment ${assessment.id} to PDF finished`
      );
    } catch (e) {
      this.logger.error(
        `Failed to export PDF for assessment ${assessment.id}`,
        e
      );
      assessmentExport.status = AssessmentFileExportStatus.ERRORED;
      assessmentExport.error =
        e instanceof Error ? e.message : JSON.stringify(e);
    }

    await this.assessmentsRepository.updateFileExport({
      assessmentId: assessment.id,
      organization: assessment.organization,
      type: AssessmentFileExportType.PDF,
      data: assessmentExport,
    });
  }
}

export const tokenExportPDFUseCase = createInjectionToken<ExportPDFUseCase>(
  'ExportWellArchitectedToolUseCase',
  {
    useClass: ExportPDFUseCaseImpl,
  }
);
