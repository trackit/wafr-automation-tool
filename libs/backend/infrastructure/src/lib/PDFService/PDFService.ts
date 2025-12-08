import { Font, renderToBuffer } from '@react-pdf/renderer';

import { Assessment, SeverityType } from '@backend/models';
import type { PDFServicePort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenFindingsRepository } from '../infrastructure';
import { tokenLogger } from '../Logger';
import { AssessmentDocument } from './components/AssessmentDocument';

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: './assets/Inter-regular.ttf',
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    {
      src: './assets/Inter-bold.ttf',
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  ],
});

export class PDFService implements PDFServicePort {
  private readonly logger = inject(tokenLogger);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly renderToBuffer = inject(tokenPDFRenderToBuffer);
  private readonly assessmentDocument = inject(tokenPDFAssessmentDocument);

  public async exportAssessment(args: {
    assessment: Assessment;
    versionName: string;
  }): Promise<Buffer> {
    const { assessment, versionName } = args;

    this.logger.info(`Exporting assessment ${assessment.name}`);
    const allowed = [
      SeverityType.Critical,
      SeverityType.High,
      SeverityType.Medium,
      SeverityType.Low,
      SeverityType.Informational,
    ];

    const findings = await this.findingsRepository.getAll({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });

    const filtered = findings.filter(
      (f) => f.severity !== undefined && allowed.includes(f.severity),
    );
    this.logger.info(`Number of findings found : ${filtered.length}`);

    const order = allowed;
    filtered.sort(
      (a, b) => order.indexOf(a.severity!) - order.indexOf(b.severity!),
    );

    const buffer = await this.renderToBuffer(
      this.assessmentDocument({
        assessmentName: assessment.name,
        versionName,
        findings: filtered,
      }),
    );
    this.logger.info(
      `Exporting assessment ${assessment.id} to PDF done for ${findings.length} findings`,
    );
    return buffer;
  }
}

export const tokenPDFAssessmentDocument = createInjectionToken<
  typeof AssessmentDocument
>('PDFAssessmentDocument', {
  useValue: AssessmentDocument,
});

export const tokenPDFRenderToBuffer = createInjectionToken(
  'PDFRenderToBuffer',
  {
    useValue: renderToBuffer,
  },
);

export const tokenPDFService = createInjectionToken<PDFServicePort>(
  'PDFService',
  {
    useClass: PDFService,
  },
);
