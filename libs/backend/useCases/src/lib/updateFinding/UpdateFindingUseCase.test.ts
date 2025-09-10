import {
  registerTestInfrastructure,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import { FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { FindingNotFoundError } from '../../errors';
import { UpdateFindingUseCaseImpl } from './UpdateFindingUseCase';
import { UpdateFindingUseCaseArgsMother } from './UpdateFindingUseCaseArgsMother';

describe('UpdateFindingUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase } = setup();

    const user = UserMother.basic().build();

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(user)
      .build();

    await expect(useCase.updateFinding(input)).rejects.toThrow(
      FindingNotFoundError
    );
  });

  it('should update finding visibility', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const finding = FindingMother.basic().withHidden(false).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withHidden(true)
      .withUser(user)
      .build();

    await useCase.updateFinding(input);

    const updatedFinding = await fakeFindingsRepository.get({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      findingId: finding.id,
    });
    expect(updatedFinding).toBeDefined();
    expect(updatedFinding?.hidden).toBe(true);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new UpdateFindingUseCaseImpl(),
    fakeFindingsRepository: inject(tokenFindingsRepository),
  };
};
