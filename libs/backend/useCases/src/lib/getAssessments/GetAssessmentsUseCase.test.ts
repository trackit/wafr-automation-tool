import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { GetAssessmentsUseCaseImpl } from './GetAssessmentsUseCase';
import { GetAssessmentsUseCaseArgsMother } from './GetAssessmentsUseCaseArgsMother';

vitest.useFakeTimers();

describe('GetAssessmentsUseCase', () => {
  it('should return all assessments', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetAssessmentsUseCaseArgsMother.basic()
      .withUser(user)
      .build();

    const { assessments } = await useCase.getAssessments(input);

    expect(assessments).toEqual([assessment]);
  });

  it('should return an empty list if no assessments', async () => {
    const { useCase } = setup();

    const user = UserMother.basic().build();

    const input = GetAssessmentsUseCaseArgsMother.basic()
      .withUser(user)
      .build();

    const { assessments } = await useCase.getAssessments(input);

    expect(assessments).toEqual([]);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetAssessmentsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
