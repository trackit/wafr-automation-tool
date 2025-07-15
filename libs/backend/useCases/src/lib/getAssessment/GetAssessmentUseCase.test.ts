import { AssessmentMother, FindingMother } from '@backend/models';
import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { GetAssessmentUseCaseImpl } from './GetAssessmentUseCase';
import { GetAssessmentUseCaseArgsMother } from './GetAssessmentUseCaseArgsMother';

describe('GetAssessmentUseCase', () => {
  it('should throw a NotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    const input = GetAssessmentUseCaseArgsMother.basic().build();
    await expect(useCase.getAssessment(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if assessment exist for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .build();
    await expect(useCase.getAssessment(input)).rejects.toThrow(NotFoundError);
  });

  it('should return the assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic().build(),
    ];

    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withOrganization('test.io')
      .build();
    const assessment = await useCase.getAssessment(input);

    expect(assessment).toEqual(
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
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
