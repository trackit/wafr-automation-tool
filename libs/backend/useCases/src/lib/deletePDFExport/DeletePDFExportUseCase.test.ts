import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  AssessmentStep,
  PillarMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ConflictError, NotFoundError } from '../Errors';
import { DeletePDFExportUseCaseImpl } from './DeletePDFExportUseCase';
import { DeletePDFExportUseCaseArgsMother } from './DeletePDFExportUseCaseArgsMother';

describe('deletePDFExport UseCase', () => {
  it('should call the ObjectsStorage and AssessmentRepository infrastructures', async () => {
    const { useCase, fakeObjectsStorage, fakeAssessmentsRepository } = setup();

    const objectKey = 'object-key';
    await fakeObjectsStorage.put({ key: objectKey, body: 'object-value' });

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .withFileExports({
        [AssessmentFileExportType.PDF]: [
          AssessmentFileExportMother.basic()
            .withId('file-export-id')
            .withStatus(AssessmentFileExportStatus.COMPLETED)
            .withVersionName('version-name')
            .withObjectKey('object-key')
            .withCreatedAt(new Date())
            .build(),
        ],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.deletePDFExport(input)).resolves.toBeUndefined();

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organization: assessment.organization,
    });
    expect(
      updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF]
    ).toStrictEqual([]);

    const updatedObject = await fakeObjectsStorage.get(objectKey);
    expect(updatedObject).toBeNull();
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = DeletePDFExportUseCaseArgsMother.basic().build();
    await expect(useCase.deletePDFExport(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if the file export does not exist on the assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withFileExports({
        [AssessmentFileExportType.PDF]: [],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.deletePDFExport(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the file export is in progress', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withFileExports({
        [AssessmentFileExportType.PDF]: [
          AssessmentFileExportMother.basic()
            .withId('file-export-id')
            .withStatus(AssessmentFileExportStatus.IN_PROGRESS)
            .withVersionName('version-name')
            .withCreatedAt(new Date())
            .build(),
        ],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.deletePDFExport(input)).rejects.toThrow(ConflictError);
  });

  it('should not call delete on ObjectsStorage if the file export does not have an object key', async () => {
    const { useCase, fakeObjectsStorage, fakeAssessmentsRepository } = setup();

    const objectKey = 'object-key';
    await fakeObjectsStorage.put({ key: objectKey, body: 'object-value' });

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withFileExports({
        [AssessmentFileExportType.PDF]: [
          AssessmentFileExportMother.basic()
            .withId('file-export-id')
            .withStatus(AssessmentFileExportStatus.COMPLETED)
            .withVersionName('version-name')
            .withCreatedAt(new Date())
            .build(),
        ],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.deletePDFExport(input)).resolves.toBeUndefined();

    const updatedObject = await fakeObjectsStorage.get(objectKey);
    expect(updatedObject).not.toBeNull();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const fakeObjectsStorage = inject(tokenFakeObjectsStorage);
  vitest.spyOn(fakeObjectsStorage, 'delete');

  return {
    useCase: new DeletePDFExportUseCaseImpl(),
    fakeObjectsStorage,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
