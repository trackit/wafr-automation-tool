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
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = UpdateAssessmentUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.updateAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should update assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withName('Old Name')
      .build();

    const input = UpdateAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withName('New Name')
      .build();
    await useCase.updateAssessment(input);

    expect(
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
      ]
    ).toEqual(
      expect.objectContaining({
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
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
