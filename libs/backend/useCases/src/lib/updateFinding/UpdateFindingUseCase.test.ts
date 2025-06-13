import {
  AssessmentMother,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { UpdateFindingUseCaseImpl } from './UpdateFindingUseCase';
import { UpdateFindingUseCaseArgsMother } from './UpdateFindingUseCaseArgsMother';

describe('UpdateFindingUseCase', () => {
  it('should throw a NotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [];

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#finding-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.updateFinding(input)).rejects.toThrow(NotFoundError);
  });

  it('should update finding visibility', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withHidden(false)
        .build(),
    ];

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#12345')
      .withHidden(true)
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.updateFinding(input);
    const updatedFinding = fakeAssessmentsRepository.assessmentFindings[
      'assessment-id#test.io'
    ].find((finding) => finding.id === 'scanning-tool#12345');
    expect(updatedFinding).toBeDefined();
    expect(updatedFinding?.hidden).toBe(true);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new UpdateFindingUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
