import { NotFoundError } from '@backend/errors';
import { AssessmentMother, FindingMother, UserMother } from '@backend/models';
import {
  FakeAssessmentsRepository,
  FakeAssessmentsStateMachine,
  tokenAssessmentsRepository,
  tokenAssessmentsStateMachine,
} from '@backend/infrastructure';
import { register, reset } from '@shared/di-container';

import { DeleteAssessmentUseCaseImpl } from './deleteAssessment';
import { DeleteAssessmentUseCaseArgsMother } from './DeleteAssessmentUseCaseArgsMother';

describe('deleteAssessment UseCase', () => {
  it('should throw if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = DeleteAssessmentUseCaseArgsMother.basic().build();
    await expect(useCase.deleteAssessment(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw NotFoundError if assessment exist for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.deleteAssessment(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should delete assessments findings', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic().build(),
    ];

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.deleteAssessment(input);

    expect(
      fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io']
    ).toBeUndefined();
  });

  it('should delete assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.deleteAssessment(input);

    expect(
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
    ).toBeUndefined();
  });

  it('should cancel state machine', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withExecutionArn('test-arn')
        .build();

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
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

  const fakeAssessmentsStateMachine = new FakeAssessmentsStateMachine();
  vitest.spyOn(fakeAssessmentsStateMachine, 'cancelAssessment');
  register(tokenAssessmentsStateMachine, {
    useValue: fakeAssessmentsStateMachine,
  });

  const fakeAssessmentsRepository = new FakeAssessmentsRepository();
  fakeAssessmentsRepository.assessments = {};
  fakeAssessmentsRepository.assessmentFindings = {};
  register(tokenAssessmentsRepository, { useValue: fakeAssessmentsRepository });

  const useCase = new DeleteAssessmentUseCaseImpl();
  return { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine };
};
