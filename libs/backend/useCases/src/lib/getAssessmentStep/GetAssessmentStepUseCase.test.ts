import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
  FindingMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors/AssessmentErrors';
import { GetAssessmentStepUseCaseImpl } from './GetAssessmentStepUseCase';
import { GetAssessmentStepUseCaseArgsMother } from './GetAssessmentStepUseCaseArgsMother';

describe('GetAssessmentStepUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GetAssessmentStepUseCaseArgsMother.basic().build();
    await expect(useCase.getAssessmentStep(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should pass the executionArn to the state machine', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeAssessmentsStateMachine,
      fakeFindingsRepository,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withExecutionArn('execution-arn')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const finding = FindingMother.basic().build();
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      finding,
    });

    fakeAssessmentsStateMachine.getAssessmentStep = vi
      .fn()
      .mockResolvedValue(AssessmentStep.PREPARING_ASSOCIATIONS);

    const input = GetAssessmentStepUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .build();
    await useCase.getAssessmentStep(input);

    expect(fakeAssessmentsStateMachine.getAssessmentStep).toHaveBeenCalledWith(
      assessment.executionArn,
    );
  });

  it('should return the assessment step from the state machine', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeAssessmentsStateMachine,
      fakeFindingsRepository,
    } = setup();

    const assessment = AssessmentMother.basic()
      .withExecutionArn('execution-arn')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const finding = FindingMother.basic().build();
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      finding,
    });

    fakeAssessmentsStateMachine.getAssessmentStep = vi
      .fn()
      .mockResolvedValue(AssessmentStep.PREPARING_ASSOCIATIONS);

    const input = GetAssessmentStepUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
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
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
