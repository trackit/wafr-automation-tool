import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { FindingNotFoundError } from '../../errors';
import { UpdateFindingUseCaseImpl } from './UpdateFindingUseCase';
import { UpdateFindingUseCaseArgsMother } from './UpdateFindingUseCaseArgsMother';

describe('UpdateFindingUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [];

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.updateFinding(input)).rejects.toThrow(
      FindingNotFoundError
    );
  });

  it('should update finding visibility', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withHidden(false)
        .build(),
    ];

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#12345')
      .withHidden(true)
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await useCase.updateFinding(input);
    const updatedFinding = fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
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
