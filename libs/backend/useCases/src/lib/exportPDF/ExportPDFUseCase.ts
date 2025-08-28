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

  private normalizeFilename(input: string): string {
    // Trim whitespace
    const name = input.trim();

    let base = name;
    let ext = '';

    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
      base = name.slice(0, lastDotIndex);
      ext = name.slice(lastDotIndex + 1);
    } else {
      // keep whole name as base (no extension or dotfile)
      base = name;
      ext = '';
    }

    // Normalize Unicode (decompose) and remove diacritic marks
    // e.g. "résumé" -> "resume"
    const removeDiacritics = (s: string) =>
      s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

    base = removeDiacritics(base);
    ext = removeDiacritics(ext);

    // Replace whitespace sequences with single hyphen
    base = base.replace(/\s+/g, '-');

    // Remove control characters
    // eslint-disable-next-line no-control-regex
    base = base.replace(/[\x00-\x1F\x7F]/g, '');
    // eslint-disable-next-line no-control-regex
    ext = ext.replace(/[\x00-\x1F\x7F]/g, '');

    // Keep only safe characters: letters, digits, dot, underscore, hyphen
    // For base we also allow dots (.) but will collapse consecutive dots below.
    base = base.replace(/[^A-Za-z0-9._-]+/g, '-');
    ext = ext.replace(/[^A-Za-z0-9._-]+/g, '');

    // Collapse repeated separators (hyphens, underscores, dots)
    base = base.replace(/[-_]{2,}/g, '-');
    base = base.replace(/\.{2,}/g, '.');

    // Trim separators from start/end
    base = base.replace(/^[-_.]+|[-_.]+$/g, '');

    return ext ? `${base}.${ext}` : base;
  }

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
      const filename = this.normalizeFilename(
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
