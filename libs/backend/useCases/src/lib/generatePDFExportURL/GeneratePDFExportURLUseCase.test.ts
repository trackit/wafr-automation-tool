import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
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

import { ConflictError, NoContentError, NotFoundError } from '../Errors';
import { GeneratePDFExportURLUseCaseImpl } from './GeneratePDFExportURLUseCase';
import { GeneratePDFExportURLUseCaseArgsMother } from './GeneratePDFExportURLUseCaseArgsMother';

describe('generatePDFExportURL UseCase', () => {
  it('should generate the PDF export URL', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
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

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.generatePDFExportURL(input)).resolves.toStrictEqual(
      'https://fake-storage.com/object-key?expiresInSeconds=3600'
    );
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GeneratePDFExportURLUseCaseArgsMother.basic().build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a NotFoundError if the file export does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a ConflictError if the file export is not completed', async () => {
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

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      ConflictError
    );
  });

  it('should throw a NoContentError if the file export does not have an object key', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

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

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFileExportId('file-export-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      NoContentError
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GeneratePDFExportURLUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
