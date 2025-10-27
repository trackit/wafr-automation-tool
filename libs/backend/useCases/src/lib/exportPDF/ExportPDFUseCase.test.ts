import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
  tokenFakePDFService,
} from '@backend/infrastructure';
import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  PillarMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentNotFinishedError,
  AssessmentNotFoundError,
} from '../../errors';
import { ExportPDFUseCaseImpl } from './ExportPDFUseCase';
import { ExportPDFUseCaseArgsMother } from './ExportPDFUseCaseArgsMother';

describe('exportPDF UseCase', () => {
  it('should call the ObjectsStorage and PDFService infrastructure', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakePDFService,
      fakeObjectsStorage,
    } = setup();

    const pdfContent = 'test-pdf-content';
    vi.spyOn(fakePDFService, 'exportAssessment').mockResolvedValueOnce(
      Buffer.from(pdfContent),
    );

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.NOT_STARTED)
      .build();
    const assessment = AssessmentMother.basic()
      .withFinishedAt(new Date())
      .withPillars([PillarMother.basic().build()])
      .withFileExports({
        [AssessmentFileExportType.PDF]: [assessmentFileExport],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withFileExportId(assessmentFileExport.id)
      .build();

    await expect(useCase.exportPDF(input)).resolves.toBeUndefined();

    expect(fakePDFService.exportAssessment).toHaveBeenCalledExactlyOnceWith({
      assessment,
      versionName: assessmentFileExport.versionName,
    });

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    const objectKey =
      updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF]?.[0]
        .objectKey;
    expect(objectKey).toBeDefined();

    const updatedObject = await fakeObjectsStorage.get(objectKey!);
    expect(updatedObject).toBe(pdfContent);
  });

  it('should throw AssessmentNotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = ExportPDFUseCaseArgsMother.basic().build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().withPillars(undefined).build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withFinishedAt(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withFinishedAt(new Date())
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new ExportPDFUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakePDFService: inject(tokenFakePDFService),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
  };
};
