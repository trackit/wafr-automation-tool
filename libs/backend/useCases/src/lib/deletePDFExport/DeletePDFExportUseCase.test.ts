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
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentFileExportNotFinishedError,
  AssessmentFileExportNotFoundError,
  AssessmentNotFoundError,
} from '../../errors';
import { DeletePDFExportUseCaseImpl } from './DeletePDFExportUseCase';
import { DeletePDFExportUseCaseArgsMother } from './DeletePDFExportUseCaseArgsMother';

describe('deletePDFExport UseCase', () => {
  it('should call the ObjectsStorage and AssessmentRepository infrastructures', async () => {
    const { useCase, fakeObjectsStorage, fakeAssessmentsRepository } = setup();

    const objectKey = 'object-key';
    await fakeObjectsStorage.put({ key: objectKey, body: 'object-value' });

    const user = UserMother.basic().build();

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.COMPLETED)
      .withObjectKey(objectKey)
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports({
        [AssessmentFileExportType.PDF]: [assessmentFileExport],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId(assessmentFileExport.id)
      .withUser(user)
      .build();

    await expect(useCase.deletePDFExport(input)).resolves.toBeUndefined();

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(
      updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF],
    ).toStrictEqual([]);

    const updatedObject = await fakeObjectsStorage.get(objectKey);
    expect(updatedObject).toBeNull();
  });

  it('should throw AssessmentNotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = DeletePDFExportUseCaseArgsMother.basic().build();

    await expect(useCase.deletePDFExport(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw AssessmentFileExportNotFoundError if the file export does not exist on the assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports({
        [AssessmentFileExportType.PDF]: [],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId('file-export-id')
      .withUser(user)
      .build();

    await expect(useCase.deletePDFExport(input)).rejects.toThrow(
      AssessmentFileExportNotFoundError,
    );
  });

  it('should throw AssessmentFileExportNotFinishedError if the file export is in progress', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.IN_PROGRESS)
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports({
        [AssessmentFileExportType.PDF]: [assessmentFileExport],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId(assessmentFileExport.id)
      .withUser(user)
      .build();
    await expect(useCase.deletePDFExport(input)).rejects.toThrow(
      AssessmentFileExportNotFinishedError,
    );
  });

  it('should not call delete on ObjectsStorage if the file export does not have an object key', async () => {
    const { useCase, fakeObjectsStorage, fakeAssessmentsRepository } = setup();

    const objectKey = 'object-key';
    await fakeObjectsStorage.put({ key: objectKey, body: 'object-value' });

    const user = UserMother.basic().build();

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.COMPLETED)
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports({
        [AssessmentFileExportType.PDF]: [assessmentFileExport],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeletePDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId(assessmentFileExport.id)
      .withUser(user)
      .build();

    await useCase.deletePDFExport(input);

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
