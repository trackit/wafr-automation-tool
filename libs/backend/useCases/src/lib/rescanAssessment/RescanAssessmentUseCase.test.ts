import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { RescanAssessmentUseCaseImpl } from './RescanAssessmentUseCase';
import { RescanAssessmentUseCaseArgsMother } from './RescanAssessmentUseCaseArgsMother';

describe('RescanAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = RescanAssessmentUseCaseArgsMother.basic().build();

    await expect(useCase.rescanAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should delete assessments findings', async () => {
    const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
      setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const finding = FindingMother.basic().build();
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      finding,
    });

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.rescanAssessment(input);

    const findings = await fakeFindingsRepository.getAll({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(findings).toBeUndefined();
  });

  it('should update executionArn to new value', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    fakeAssessmentsStateMachine.startAssessment = vitest
      .fn()
      .mockResolvedValue('new-test-arn');

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.rescanAssessment(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment?.executionArn).toBe('new-test-arn');
  });

  it('should cancel old state machine execution', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withExecutionArn('old-test-arn')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.rescanAssessment(input);

    expect(
      fakeAssessmentsStateMachine.cancelAssessment
    ).toHaveBeenCalledExactlyOnceWith(assessment.executionArn);
  });

  it('should start a new state machine execution with old parameters', async () => {
    const {
      useCase,
      fakeAssessmentsRepository,
      fakeAssessmentsStateMachine,
      date,
    } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withExecutionArn('old-test-arn')
      .withRegions(['us-east-1'])
      .withRoleArn('test-role-arn')
      .withWorkflows(['test-workflow'])
      .withName('test-assessment')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = RescanAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.rescanAssessment(input);

    expect(
      fakeAssessmentsStateMachine.startAssessment
    ).toHaveBeenCalledExactlyOnceWith({
      name: assessment.name,
      regions: assessment.regions,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
      assessmentId: assessment.id,
      createdAt: date,
      createdBy: user.id,
      organizationDomain: user.organizationDomain,
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

  return {
    useCase: new RescanAssessmentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
    fakeAssessmentsStateMachine,
    date,
  };
};
