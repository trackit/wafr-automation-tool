import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, FindingMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError, FindingNotFoundError } from '../../errors';
import { UpdateFindingUseCaseImpl } from './UpdateFindingUseCase';
import { UpdateFindingUseCaseArgsMother } from './UpdateFindingUseCaseArgsMother';

describe('UpdateFindingUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdateFindingUseCaseArgsMother.basic().build();

    await expect(useCase.updateFinding(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFindingId('scanning-tool#finding-id')
      .withUser(user)
      .build();

    await expect(useCase.updateFinding(input)).rejects.toThrow(
      FindingNotFoundError,
    );
  });

  it('should update finding visibility', async () => {
    const { useCase, fakeFindingsRepository, fakeAssessmentsRepository } =
      setup();

    const user = UserMother.basic().build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    const finding = FindingMother.basic().withHidden(false).build();
    await fakeAssessmentsRepository.save(assessment);
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = UpdateFindingUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFindingId(finding.id)
      .withHidden(true)
      .withUser(user)
      .build();

    await useCase.updateFinding(input);

    const updatedFinding = await fakeFindingsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      findingId: finding.id,
      version: assessment.latestVersionNumber,
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
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
