import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { ListPDFExportsUseCaseImpl } from './ListPDFExportsUseCase';
import { ListPDFExportsUseCaseArgsMother } from './ListPDFExportsUseCaseArgsMother';

describe('listPDFExports UseCase', () => {
  it('should list the PDF exports', async () => {
    const {
      useCase,

      fakeAssessmentsRepository,
    } = setup();

    const fileExport = {
      id: 'file-export-id',
      status: AssessmentFileExportStatus.COMPLETED,
      versionName: 'version-name',
      objectKey: 'object-key',
      createdAt: new Date(),
    };
    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [fileExport],
        })
        .build();

    const input = ListPDFExportsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.listPDFExports(input)).resolves.toStrictEqual([
      fileExport,
    ]);
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = ListPDFExportsUseCaseArgsMother.basic().build();
    await expect(useCase.listPDFExports(input)).rejects.toThrow(NotFoundError);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new ListPDFExportsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
