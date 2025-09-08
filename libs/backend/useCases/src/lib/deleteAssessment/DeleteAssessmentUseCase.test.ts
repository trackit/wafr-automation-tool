import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { DeleteAssessmentUseCaseImpl } from './DeleteAssessmentUseCase';
import { DeleteAssessmentUseCaseArgsMother } from './DeleteAssessmentUseCaseArgsMother';

describe('deleteAssessment UseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = DeleteAssessmentUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.deleteAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should delete assessments findings', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .build();
    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [FindingMother.basic().build()];

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.deleteAssessment(input);

    expect(
      fakeAssessmentsRepository.assessmentFindings[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
      ]
    ).toBeUndefined();
  });

  it('should delete assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .build();

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.deleteAssessment(input);

    expect(
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
      ]
    ).toBeUndefined();
  });

  it('should cancel state machine', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withExecutionArn('test-arn')
      .build();

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.deleteAssessment(input);

    expect(
      fakeAssessmentsStateMachine.cancelAssessment
    ).toHaveBeenCalledExactlyOnceWith('test-arn');
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeAssessmentsStateMachine = inject(tokenFakeAssessmentsStateMachine);
  vitest.spyOn(fakeAssessmentsStateMachine, 'cancelAssessment');
  const useCase = new DeleteAssessmentUseCaseImpl();
  return {
    useCase,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeAssessmentsStateMachine,
  };
};
