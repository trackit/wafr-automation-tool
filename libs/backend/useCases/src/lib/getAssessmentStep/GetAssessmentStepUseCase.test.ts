import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
  FindingMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { GetAssessmentStepUseCaseImpl } from './GetAssessmentStepUseCase';
import { GetAssessmentStepUseCaseArgsMother } from './GetAssessmentStepUseCaseArgsMother';

describe('GetAssessmentStepUseCase', () => {
  it('should throw a NotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    const input = GetAssessmentStepUseCaseArgsMother.basic().build();
    await expect(useCase.getAssessmentStep(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a NotFoundError if assessment exist for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = GetAssessmentStepUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .build();
    await expect(useCase.getAssessmentStep(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should pass the executionArn to the state machine', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withExecutionArn('execution-arn')
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic().build(),
    ];
    fakeAssessmentsStateMachine.getAssessmentStep = vi
      .fn()
      .mockResolvedValue(AssessmentStep.PREPARING_ASSOCIATIONS);

    const input = GetAssessmentStepUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .build();
    await useCase.getAssessmentStep(input);

    expect(fakeAssessmentsStateMachine.getAssessmentStep).toHaveBeenCalledWith(
      'execution-arn'
    );
  });

  it('should return the assessment step from the state machine', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic().build(),
    ];
    fakeAssessmentsStateMachine.getAssessmentStep = vi
      .fn()
      .mockResolvedValue(AssessmentStep.PREPARING_ASSOCIATIONS);

    const input = GetAssessmentStepUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .build();
    const assessmentStep = await useCase.getAssessmentStep(input);

    expect(assessmentStep).toEqual(AssessmentStep.PREPARING_ASSOCIATIONS);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new GetAssessmentStepUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeAssessmentsStateMachine: inject(tokenFakeAssessmentsStateMachine),
  };
};
