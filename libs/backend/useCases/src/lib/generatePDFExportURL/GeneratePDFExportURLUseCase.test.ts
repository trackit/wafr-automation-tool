import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentMother,
  PillarMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentFileExportFieldNotFoundError,
  AssessmentFileExportNotFinishedError,
  AssessmentFileExportNotFoundError,
  AssessmentNotFoundError,
} from '../../errors';
import { GeneratePDFExportURLUseCaseImpl } from './GeneratePDFExportURLUseCase';
import { GeneratePDFExportURLUseCaseArgsMother } from './GeneratePDFExportURLUseCaseArgsMother';

describe('generatePDFExportURL UseCase', () => {
  it('should generate the PDF export URL', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.COMPLETED)
      .withObjectKey('object-key')
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinishedAt(new Date())
      .withPillars([PillarMother.basic().build()])
      .withFileExports([assessmentFileExport])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId(assessmentFileExport.id)
      .withUser(user)
      .build();
    await expect(useCase.generatePDFExportURL(input)).resolves.toStrictEqual(
      'https://fake-storage.com/object-key?expiresInSeconds=3600',
    );
  });

  it('should throw AssessmentNotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GeneratePDFExportURLUseCaseArgsMother.basic().build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw AssessmentFileExportNotFoundError if the file export does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId('file-export-id')
      .withUser(user)
      .build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      AssessmentFileExportNotFoundError,
    );
  });

  it('should throw AssessmentFileExportNotFinishedError if the file export is not completed', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.IN_PROGRESS)
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports([assessmentFileExport])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId(assessmentFileExport.id)
      .withUser(user)
      .build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      AssessmentFileExportNotFinishedError,
    );
  });

  it('should throw AssessmentFileExportFieldNotFoundError if the file export does not have an object key', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessmentFileExport = AssessmentFileExportMother.basic()
      .withStatus(AssessmentFileExportStatus.COMPLETED)
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFileExports([assessmentFileExport])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GeneratePDFExportURLUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFileExportId(assessmentFileExport.id)
      .withUser(user)
      .build();
    await expect(useCase.generatePDFExportURL(input)).rejects.toThrow(
      AssessmentFileExportFieldNotFoundError,
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
