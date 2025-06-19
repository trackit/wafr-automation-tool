import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import { inject, register, reset } from '@shared/di-container';

import { AssessmentMother } from '@backend/models';
import { NotFoundError } from '../Errors';
import { CleanupUseCaseImpl, tokenDebug } from './CleanupUseCase';
import { CleanupUseCaseArgsMother } from './CleanupUseCaseArgsMother';

describe('CleanupUseCase', () => {
  it('should delete assessment storage if not in debug mode', async () => {
    const { useCase, fakeAssessmentsStorage } = setup();

    const input = CleanupUseCaseArgsMother.basic().withError(undefined).build();
    await useCase.cleanup(input);

    expect(fakeAssessmentsStorage.list).toHaveBeenCalledExactlyOnceWith({
      prefix: 'assessments/assessment-id',
    });
  });

  it('should not delete assessment storage if debug mode is enabled', async () => {
    const { useCase, fakeAssessmentsStorage } = setup(true);

    const input = CleanupUseCaseArgsMother.basic().withError(undefined).build();
    await useCase.cleanup(input);

    expect(fakeAssessmentsStorage.list).not.toHaveBeenCalled();
  });

  it('should throw a NotFoundError if the assessment doesn’t exist and error is defined', async () => {
    const { useCase } = setup();

    const input = CleanupUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .withError({ Cause: 'test-cause', Error: 'test-error' })
      .build();
    await expect(useCase.cleanup(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if the assessment exist for an another organization and error is defined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = CleanupUseCaseArgsMother.basic()
      .withError({ Cause: 'test-cause', Error: 'test-error' })
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .build();
    await expect(useCase.cleanup(input)).rejects.toThrow(NotFoundError);
  });

  it('should delete assessment findings if not in debug mode and error is defined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    const input = CleanupUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .withError({ Cause: 'test-cause', Error: 'test-error' })
      .build();
    await useCase.cleanup(input);

    expect(
      fakeAssessmentsRepository.deleteFindings
    ).toHaveBeenCalledExactlyOnceWith({
      assessmentId: 'assessment-id',
      organization: 'test.io',
    });
  });

  it('should not delete assessment findings if debug mode is enabled and error is defined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup(true);

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    const input = CleanupUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .withError({ Cause: 'test-cause', Error: 'test-error' })
      .build();
    await useCase.cleanup(input);

    expect(fakeAssessmentsRepository.deleteFindings).not.toHaveBeenCalled();
  });

  it('should update assessment error if error is defined', async () => {
    const { useCase, fakeAssessmentsRepository } = setup(true);

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    const input = CleanupUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .withError({ Cause: 'test-cause', Error: 'test-error' })
      .build();
    await useCase.cleanup(input);

    expect(fakeAssessmentsRepository.update).toHaveBeenCalledExactlyOnceWith({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      assessmentBody: {
        error: {
          error: 'test-error',
          cause: 'test-cause',
        },
      },
    });
    const updatedAssessment =
      fakeAssessmentsRepository.assessments['assessment-id#test.io'];
    expect(updatedAssessment.error).toEqual({
      error: 'test-error',
      cause: 'test-cause',
    });
  });
});

const setup = (debug = false) => {
  reset();
  registerTestInfrastructure();
  register(tokenDebug, { useValue: debug });
  const fakeAssessmentsStorage = inject(tokenFakeObjectsStorage);
  vitest.spyOn(fakeAssessmentsStorage, 'list');
  const fakeAssessmentsRepository = inject(tokenFakeAssessmentsRepository);
  vitest.spyOn(fakeAssessmentsRepository, 'deleteFindings');
  vitest.spyOn(fakeAssessmentsRepository, 'update');
  return {
    useCase: new CleanupUseCaseImpl(),
    fakeAssessmentsRepository,
    fakeAssessmentsStorage,
  };
};
