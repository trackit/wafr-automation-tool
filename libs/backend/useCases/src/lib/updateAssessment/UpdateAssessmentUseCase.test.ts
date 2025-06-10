import { AssessmentMother, UserMother } from '@backend/models';
import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { UpdateAssessmentUseCaseImpl } from './UpdateAssessmentUseCase';
import { UpdateAssessmentUseCaseArgsMother } from './UpdateAssessmentUseCaseArgsMother';

describe('UpdateAssessmentUseCase', () => {
  it('should throw a NotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdateAssessmentUseCaseArgsMother.basic().build();
    await expect(useCase.updateAssessment(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a NotFoundError if assessment exist for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = UpdateAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.updateAssessment(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should update assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withName('Old Name')
        .build();

    const input = UpdateAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withName('New Name')
      .build();
    await useCase.updateAssessment(input);

    expect(
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
    ).toEqual(
      expect.objectContaining({
        id: 'assessment-id',
        name: 'New Name',
      })
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
