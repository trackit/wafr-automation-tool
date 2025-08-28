import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import {
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
    fakeObjectsStorage.objects[objectKey] = 'object-value';

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withPillars([PillarMother.basic().build()])
        .withFileExports({
          [AssessmentFileExportType.PDF]: [
            {
              id: 'file-export-id',
              status: AssessmentFileExportStatus.COMPLETED,
              versionName: 'version-name',
              objectKey: 'object-key',
              createdAt: new Date(),
            },
          ],
        })
        .build();

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.deletePDFExport(input)).resolves.toBeUndefined();

    expect(fakeObjectsStorage.objects[objectKey]).toBeUndefined();
    expect(
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
        .fileExports?.[AssessmentFileExportType.PDF]
    ).toStrictEqual([]);
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = DeletePDFExportUseCaseArgsMother.basic().build();
    await expect(useCase.deletePDFExport(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if the file export does not exist on the assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [],
        })
        .build();

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.deletePDFExport(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the file export is in progress', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [
            {
              id: 'file-export-id',
              status: AssessmentFileExportStatus.IN_PROGRESS,
              versionName: 'version-name',
              createdAt: new Date(),
            },
          ],
        })
        .build();

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
    fakeObjectsStorage.objects[objectKey] = 'object-value';

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [
            {
              id: 'file-export-id',
              status: AssessmentFileExportStatus.COMPLETED,
              versionName: 'version-name',
              createdAt: new Date(),
            },
          ],
        })

        .build();

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.deletePDFExport(input)).resolves.toBeUndefined();
    expect(fakeObjectsStorage.objects[objectKey]).toBeDefined();
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
