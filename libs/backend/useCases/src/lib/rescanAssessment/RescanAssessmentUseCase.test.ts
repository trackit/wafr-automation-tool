import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
  FindingMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { RescanAssessmentUseCaseImpl } from './RescanAssessmentUseCase';
import { RescanAssessmentUseCaseArgsMother } from './RescanAssessmentUseCaseArgsMother';

describe('RescanAssessmentUseCase', () => {
  it('should throw a NotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    const input = RescanAssessmentUseCaseArgsMother.basic().build();
    await expect(useCase.rescanAssessment(input)).rejects.toThrow(
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

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.rescanAssessment(input)).rejects.toThrow(
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

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.rescanAssessment(input);

    expect(
      fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io']
    ).toBeUndefined();
  });

  it('should update assessment step to SCANNING_STARTED and executionArn to new value', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withStep(AssessmentStep.FINISHED)
        .withExecutionArn('old-test-arn')
        .build();

    fakeAssessmentsStateMachine.startAssessment = vitest
      .fn()
      .mockResolvedValue('new-test-arn');

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.rescanAssessment(input);

    const updatedAssessment =
      fakeAssessmentsRepository.assessments['assessment-id#test.io'];
    expect(updatedAssessment.step).toBe(AssessmentStep.SCANNING_STARTED);
    expect(updatedAssessment.executionArn).toBe('new-test-arn');
  });

  it('should cancel old state machine execution', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withExecutionArn('old-test-arn')
        .build();

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.rescanAssessment(input);

    expect(
      fakeAssessmentsStateMachine.cancelAssessment
    ).toHaveBeenCalledExactlyOnceWith('old-test-arn');
  });

  it('should start a new state machine execution with old parameters', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeAssessmentsStateMachine,
      date,
    } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withExecutionArn('old-test-arn')
        .withRegions(['us-east-1'])
        .withRoleArn('test-role-arn')
        .withWorkflows(['test-workflow'])
        .withName('test-assessment')
        .build();

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic()
          .withId('user-id')
          .withOrganizationDomain('test.io')
          .build()
      )
      .build();
    await useCase.rescanAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith({
      name: 'test-assessment',
      regions: ['us-east-1'],
      roleArn: 'test-role-arn',
      workflows: ['test-workflow'],
      assessmentId: 'assessment-id',
      createdAt: date,
      createdBy: 'user-id',
      organization: 'test.io',
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeAssessmentsStateMachine = inject(tokenFakeAssessmentsStateMachine);
  vitest.spyOn(fakeAssessmentsStateMachine, 'cancelAssessment');
  vitest.spyOn(fakeAssessmentsStateMachine, 'startAssessment');
  const date = new Date();
  vitest.setSystemTime(date);
  const useCase = new RescanAssessmentUseCaseImpl();
  return {
    useCase,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeAssessmentsStateMachine,
    date,
  };
};
