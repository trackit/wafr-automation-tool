import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenObjectsStorage,
  tokenPDFService,
} from '@backend/infrastructure';
import {
  AssessmentFileExportStatus,
  AssessmentFileExportType,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { normalizeFilename } from '@shared/utils';

import {
  AssessmentFileExportNotFoundError,
  AssessmentNotFinishedError,
  AssessmentNotFoundError,
} from '../../errors';

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

  public async exportPDF(args: ExportPDFUseCaseArgs): Promise<void> {
    const { assessmentId, organizationDomain, fileExportId } = args;

    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain,
      });
    }
    if (
      !assessment.pillars ||
      assessment.pillars.length === 0 ||
      !assessment.finished
    ) {
      throw new AssessmentNotFinishedError({
        assessmentId,
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

    assessmentExport.status = AssessmentFileExportStatus.IN_PROGRESS;
    await this.assessmentsRepository.updateFileExport({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      type: AssessmentFileExportType.PDF,
      data: assessmentExport,
    });

    try {
      const pdfFileContent = await this.pdfService.exportAssessment({
        assessment,
        versionName: assessmentExport.versionName,
      });
      const filename = normalizeFilename(
        `${assessment.name}_${assessmentExport.versionName}.pdf`,
      );
      const objectKey = `assessments/${assessment.id}/exports/${filename}`;
      await this.objectsStorage.put({
        key: objectKey,
        body: pdfFileContent,
      });

      assessmentExport.status = AssessmentFileExportStatus.COMPLETED;
      assessmentExport.objectKey = objectKey;
      this.logger.info(
        `Export for assessment ${assessment.id} to PDF finished`,
      );
    } catch (e) {
      this.logger.error(
        `Failed to export PDF for assessment ${assessment.id}`,
        e,
      );
      assessmentExport.status = AssessmentFileExportStatus.ERRORED;
      assessmentExport.error =
        e instanceof Error ? e.message : JSON.stringify(e);
    }

    await this.assessmentsRepository.updateFileExport({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      type: AssessmentFileExportType.PDF,
      data: assessmentExport,
    });
  }
}

export const tokenExportPDFUseCase = createInjectionToken<ExportPDFUseCase>(
  'ExportWellArchitectedToolUseCase',
  {
    useClass: ExportPDFUseCaseImpl,
  },
);
