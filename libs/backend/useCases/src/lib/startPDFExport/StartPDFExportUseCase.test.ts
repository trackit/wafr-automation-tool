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
  AssessmentStep,
  PillarMother,
  UserMother,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { ConflictError, NoContentError, NotFoundError } from '../Errors';
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

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withVersionName('version-name')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.startPDFExport(input)).resolves.toBeUndefined();

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organization: assessment.organization,
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
          assessmentId: 'assessment-id',
          organizationDomain: 'test.io',
          fileExportId: fileExportId,
        }),
      }
    );
  });

  it('should throw a NotFoundError if the assessment does not exist', async () => {
    const { useCase } = setup();

    const input = StartPDFExportUseCaseArgsMother.basic().build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ConflictError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars(undefined)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(ConflictError);
  });

  it('should throw a ConflictError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.PREPARING_ASSOCIATIONS)
      .withPillars([PillarMother.basic().build()])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = StartPDFExportUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(ConflictError);
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

    const input = StartPDFExportUseCaseArgsMother.basic().build();
    await expect(useCase.startPDFExport(input)).rejects.toThrow(NoContentError);
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
