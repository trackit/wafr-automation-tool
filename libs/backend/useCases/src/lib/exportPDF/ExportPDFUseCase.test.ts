import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
  tokenFakePDFService,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';
import {
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  AssessmentStep,
  PillarMother,
} from '@backend/models';

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
          {
            id: 'file-export-id',
            status: AssessmentFileExportStatus.NOT_STARTED,
            versionName,
            createdAt: new Date(),
          },
        ],
      })
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    const input = ExportPDFUseCaseArgsMother.basic().build();
    await expect(useCase.exportPDF(input)).resolves.toBeUndefined();

    expect(fakePDFService.exportAssessment).toHaveBeenCalledExactlyOnceWith({
      assessment,
      versionName,
    });

    const updatedAssessment =
      fakeAssessmentsRepository.assessments['assessment-id#test.io'];
    const objectKey =
      updatedAssessment.fileExports?.[AssessmentFileExportType.PDF]?.[0]
        .objectKey;
    expect(objectKey).toBeDefined();
    expect(fakeObjectsStorage.objects[objectKey!]).toBe(pdfContent);
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = ExportPDFUseCaseArgsMother.basic().build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars(undefined)
        .build();

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganizationDomain('test.io')
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a ConflictError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.PREPARING_ASSOCIATIONS)
        .build();

    const input = ExportPDFUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganizationDomain('test.io')
      .build();
    await expect(useCase.exportPDF(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a NoContentError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([])
        .build();

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
