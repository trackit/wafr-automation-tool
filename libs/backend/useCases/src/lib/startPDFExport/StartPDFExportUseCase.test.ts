import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeLambdaService,
} from '@backend/infrastructure';
import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  PillarMother,
  UserMother,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import {
  AssessmentNotFinishedError,
  AssessmentNotFoundError,
} from '../../errors';
import {
  StartPDFExportUseCaseImpl,
  tokenStartPDFExportLambdaArn,
} from './StartPDFExportUseCase';
import { StartPDFExportUseCaseArgsMother } from './StartPDFExportUseCaseArgsMother';

vi.useFakeTimers();

describe('startPDFExport UseCase', () => {
  it('should start the PDF export', async () => {
    const {
      date,
      useCase,
      fakeAssessmentsRepository,
      fakeLambdaService,
      lambdaArn,
    } = setup();

    const user = UserMother.basic().build();
    const versionName = 'version-name';

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinishedAt(new Date())
      .withPillars([PillarMother.basic().build()])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withVersionName(versionName)
      .withUser(user)
      .build();

    await expect(useCase.startPDFExport(input)).resolves.toBeUndefined();

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    const fileExportId = 'fake-id-0';
    expect(updatedAssessment).toMatchObject({
      fileExports: {
        [AssessmentFileExportType.PDF]: [
          AssessmentFileExportMother.basic()
            .withId(fileExportId)
            .withStatus(AssessmentFileExportStatus.NOT_STARTED)
            .withVersionName('version-name')
            .withCreatedAt(date)
            .build(),
        ],
      },
    });
    expect(fakeLambdaService.asyncInvokeLambda).toHaveBeenCalledExactlyOnceWith(
      {
        lambdaArn,
        payload: JSON.stringify({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          fileExportId: fileExportId,
        }),
      },
    );
  });

  it('should throw AssessmentNotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = StartPDFExportUseCaseArgsMother.basic().build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinishedAt(new Date())
      .withPillars(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await expect(useCase.startPDFExport(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinishedAt(undefined)
      .withPillars([PillarMother.basic().build()])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });

  it('should throw AssessmentNotFinishedError if the assessment findings are empty', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withFinishedAt(new Date())
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(
      AssessmentNotFinishedError,
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const date = new Date();
  vitest.setSystemTime(date);

  const fakeLambdaService = inject(tokenFakeLambdaService);
  vitest.spyOn(fakeLambdaService, 'asyncInvokeLambda');

  const lambdaArn =
    'arn:aws:lambda:us-west-2:123456789012:function:test-lambda';
  register(tokenStartPDFExportLambdaArn, {
    useValue: lambdaArn,
  });

  return {
    date,
    useCase: new StartPDFExportUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeLambdaService,
    lambdaArn,
  };
};
