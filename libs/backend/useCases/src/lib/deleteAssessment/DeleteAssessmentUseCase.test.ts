import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeAssessmentsStateMachine,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { DeleteAssessmentUseCaseImpl } from './DeleteAssessmentUseCase';
import { DeleteAssessmentUseCaseArgsMother } from './DeleteAssessmentUseCaseArgsMother';

describe('DeleteAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = DeleteAssessmentUseCaseArgsMother.basic().build();

    await expect(useCase.deleteAssessment(input)).rejects.toThrow(
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

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.deleteAssessment(input);

    const findings = await fakeFindingsRepository.getAll({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(findings).toBeUndefined();
  });

  it('should delete assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.deleteAssessment(input);

    const { assessments } = await fakeAssessmentsRepository.getAll({
      organizationDomain: assessment.organization,
    });
    expect(assessments).toEqual([]);
  });

  it('should cancel state machine', async () => {
    const { useCase, fakeAssessmentsRepository, fakeAssessmentsStateMachine } =
      setup();
    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withExecutionArn('test-arn')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = DeleteAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .build();

    await useCase.deleteAssessment(input);

    expect(
      fakeAssessmentsStateMachine.cancelAssessment
    ).toHaveBeenCalledExactlyOnceWith(assessment.executionArn);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const fakeAssessmentsStateMachine = inject(tokenFakeAssessmentsStateMachine);
  vitest.spyOn(fakeAssessmentsStateMachine, 'cancelAssessment');

  return {
    useCase: new DeleteAssessmentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
    fakeAssessmentsStateMachine,
  };
};
