import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentFileExportMother,
  AssessmentFileExportType,
  AssessmentMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { ListPDFExportsUseCaseImpl } from './ListPDFExportsUseCase';
import { ListPDFExportsUseCaseArgsMother } from './ListPDFExportsUseCaseArgsMother';

describe('listPDFExports UseCase', () => {
  it('should list the PDF exports', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const fileExport = AssessmentFileExportMother.basic().build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports({
        [AssessmentFileExportType.PDF]: [fileExport],
      })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = ListPDFExportsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();
    await expect(useCase.listPDFExports(input)).resolves.toStrictEqual([
      fileExport,
    ]);
  });

  it('should throw AssessmentNotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = ListPDFExportsUseCaseArgsMother.basic().build();
    await expect(useCase.listPDFExports(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
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
