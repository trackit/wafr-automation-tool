import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { GetAssessmentUseCaseImpl } from './GetAssessmentUseCase';
import { GetAssessmentUseCaseArgsMother } from './GetAssessmentUseCaseArgsMother';

describe('GetAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    const input = GetAssessmentUseCaseArgsMother.basic().build();
    await expect(useCase.getAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should return the assessment', async () => {
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

    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .build();
    const assessment = await useCase.getAssessment(input);

    expect(assessment).toEqual(
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
      ]
    );
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
