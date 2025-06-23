import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeWellArchitectedToolService,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentMother,
  AssessmentStep,
  PillarMother,
  UserMother,
} from '@backend/models';
import { ConflictError, NoContentError, NotFoundError } from '../Errors';
import { ExportWellArchitectedToolUseCaseImpl } from './ExportWellArchitectedToolUseCase';
import { ExportWellArchitectedToolUseCaseArgsMother } from './ExportWellArchitectedToolUseCaseArgsMother';

vitest.useFakeTimers();

describe('exportWellArchitectedTool UseCase', () => {
  it('should call the WellArchitectedToolService infrastructure', async () => {
    const {
      useCase,
      fakeWellArchitectedToolService,
      fakeAssessmentsRepository,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('test.io')
      .withStep(AssessmentStep.FINISHED)
      .withPillars([PillarMother.basic().build()])
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] = assessment;

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();
    await expect(useCase.exportAssessment(input)).resolves.toBeUndefined();

    expect(
      fakeWellArchitectedToolService.exportAssessment
    ).toHaveBeenCalledExactlyOnceWith(assessment, input.user);
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

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      NoContentError
    );
  });

  it('should throw a NotFoundError if the assessment doesn’t exist', async () => {
    const { useCase } = setup();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic().build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a ConflictError if the assessment findings are undefined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars(undefined)
        .build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      ConflictError
    );
  });

  it('should throw a ConflictError if the assessment is not finished', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.PREPARING_PROMPTS)
        .build();

    const input = ExportWellArchitectedToolUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.exportAssessment(input)).rejects.toThrow(
      ConflictError
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeWellArchitectedToolService = inject(
    tokenFakeWellArchitectedToolService
  );
  vitest.spyOn(fakeWellArchitectedToolService, 'exportAssessment');
  const useCase = new ExportWellArchitectedToolUseCaseImpl();
  return {
    useCase,
    fakeWellArchitectedToolService,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
