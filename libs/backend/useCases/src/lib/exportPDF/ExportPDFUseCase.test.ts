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
  AssessmentStep,
  PillarMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ConflictError, NoContentError, NotFoundError } from '../Errors';
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
      Buffer.from(pdfContent)
    );

    const versionName = 'version-name';
    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withFileExports({
        [AssessmentFileExportType.PDF]: [
          AssessmentFileExportMother.basic()
            .withId('file-export-id')
            .withStatus(AssessmentFileExportStatus.NOT_STARTED)
            .withVersionName(versionName)
            .withCreatedAt(new Date())
            .build(),
        ],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic().build();
    await expect(useCase.exportPDF(input)).resolves.toBeUndefined();

    expect(fakePDFService.exportAssessment).toHaveBeenCalledExactlyOnceWith({
      assessment,
      versionName,
    });

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organization: assessment.organization,
    });
    const objectKey =
      updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF]?.[0]
        .objectKey;
    expect(objectKey).toBeDefined();

    const updatedObject = await fakeObjectsStorage.get(objectKey!);
    expect(updatedObject).toBe(pdfContent);
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = ExportPDFUseCaseArgsMother.basic().build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withPillars(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganizationDomain('test.io')
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a ConflictError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.PREPARING_ASSOCIATIONS)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganizationDomain('test.io')
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a NoContentError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganizationDomain('test.io')
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(NoContentError);
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
