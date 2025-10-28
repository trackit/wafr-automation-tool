import { Document } from '@react-pdf/renderer';
import React from 'react';

import { AssessmentMother, FindingMother } from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { tokenFakeFindingsRepository } from '../infrastructure';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  PDFService,
  tokenPDFAssessmentDocument,
  tokenPDFRenderToBuffer,
} from './PDFService';

describe('PDFService Infrastructure', () => {
  describe('exportAssessment', () => {
    it('should call the renderToBuffer function with the correct arguments', async () => {
      const {
        pdfService,
        renderToBuffer,
        AssessmentDocument,
        fakeFindingsRepository,
      } = setup();

      const assessment = AssessmentMother.basic().build();

      const finding1 = FindingMother.basic().withId('tool#1').build();
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('tool#2').build();
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      const pdfContent = 'test-pdf-content';
      renderToBuffer.mockResolvedValueOnce(Buffer.from(pdfContent));

      const assessmentDocumentElement = React.createElement(Document, {});
      AssessmentDocument.mockReturnValueOnce(assessmentDocumentElement);

      const versionName = '1.0';
      await expect(
        pdfService.exportAssessment({
          assessment,
          versionName,
        }),
      ).resolves.toStrictEqual(Buffer.from(pdfContent));

      expect(AssessmentDocument).toHaveBeenCalledExactlyOnceWith({
        assessmentName: assessment.name,
        versionName,
        findings: [finding1, finding2],
      });
      expect(renderToBuffer).toHaveBeenCalledExactlyOnceWith(
        assessmentDocumentElement,
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const renderToBuffer = vi.fn();
  register(tokenPDFRenderToBuffer, { useValue: renderToBuffer });

  const AssessmentDocument = vi.fn();
  register(tokenPDFAssessmentDocument, { useValue: AssessmentDocument });

  return {
    pdfService: new PDFService(),
    renderToBuffer,
    AssessmentDocument,
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
