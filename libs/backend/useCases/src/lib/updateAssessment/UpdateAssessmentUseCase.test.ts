import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { AssessmentMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { UpdateAssessmentUseCaseImpl } from './UpdateAssessmentUseCase';
import { UpdateAssessmentUseCaseArgsMother } from './UpdateAssessmentUseCaseArgsMother';

describe('UpdateAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdateAssessmentUseCaseArgsMother.basic().build();

    await expect(useCase.updateAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should update assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().withName('Old Name').build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdateAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withName('New Name')
      .build();

    await useCase.updateAssessment(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment).toEqual(
      expect.objectContaining({
        id: assessment.id,
        name: input.assessmentBody.name,
      }),
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new UpdateAssessmentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
