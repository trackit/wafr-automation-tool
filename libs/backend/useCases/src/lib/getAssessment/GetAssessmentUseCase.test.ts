import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { AssessmentMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { GetAssessmentUseCaseImpl } from './GetAssessmentUseCase';
import { GetAssessmentUseCaseArgsMother } from './GetAssessmentUseCaseArgsMother';

describe('GetAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GetAssessmentUseCaseArgsMother.basic().build();

    await expect(useCase.getAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should return the assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    const returnedAssessment = await useCase.getAssessment(input);

    expect(returnedAssessment).toEqual(assessment);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetAssessmentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
