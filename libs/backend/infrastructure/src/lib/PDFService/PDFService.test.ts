import { Document } from '@react-pdf/renderer';
import React from 'react';

import {
  tokenFakeAssessmentsRepository,
  tokenPDFAssessmentDocument,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { PDFService, tokenPDFRenderToBuffer } from './PDFService';

describe('PDFService Infrastructure', () => {
  describe('exportAssessment', () => {
    it('should call the renderToBuffer function with the correct arguments', async () => {
      const {
        pdfService,
        renderToBuffer,
        AssessmentDocument,
        fakeAssessmentsRepository,
      } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment-id')
        .withName('assessment-name')
        .withOrganization('test.io')
        .withPillars([
          PillarMother.basic()
            .withId('pillar-id')
            .withQuestions([
              QuestionMother.basic()
                .withId('question-id')
                .withBestPractices([
                  BestPracticeMother.basic().withId('best-practice-id').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await fakeAssessmentsRepository.save(assessment);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar-id#question-id#best-practice-id')
        .withId('tool#1')
        .build();
      await fakeAssessmentsRepository.saveFinding({
        assessmentId: assessment.id,
        organization: assessment.organization,
        finding: finding1,
      });
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar-id#question-id#best-practice-id')
        .withId('tool#2')
        .build();
      await fakeAssessmentsRepository.saveFinding({
        assessmentId: assessment.id,
        organization: assessment.organization,
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
        })
      ).resolves.toStrictEqual(Buffer.from(pdfContent));

      expect(AssessmentDocument).toHaveBeenCalledExactlyOnceWith({
        assessmentName: 'assessment-name',
        versionName,
        findings: [finding1, finding2],
      });
      expect(renderToBuffer).toHaveBeenCalledExactlyOnceWith(
        assessmentDocumentElement
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
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
