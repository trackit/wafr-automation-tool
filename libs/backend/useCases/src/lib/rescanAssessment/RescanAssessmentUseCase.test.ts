import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { RescanAssessmentUseCaseImpl } from './RescanAssessmentUseCase';
import { RescanAssessmentUseCaseArgsMother } from './RescanAssessmentUseCaseArgsMother';

describe('RescanAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = RescanAssessmentUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.rescanAssessment(input)).rejects.toThrow(
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

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.rescanAssessment(input);

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

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.rescanAssessment(input);

    expect(
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
      ]
    ).toBeUndefined();
  });

  it('should cancel old state machine execution', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withExecutionArn('old-test-arn')
      .build();

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withExecutionArn('old-test-arn')
      .withRegions(['us-east-1'])
      .withRoleArn('test-role-arn')
      .withWorkflows(['test-workflow'])
      .withName('test-assessment')
      .build();

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
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
