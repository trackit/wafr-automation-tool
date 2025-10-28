import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, PillarMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError, PillarNotFoundError } from '../../errors';
import { UpdatePillarUseCaseImpl } from './UpdatePillarUseCase';
import { UpdatePillarUseCaseArgsMother } from './UpdatePillarUseCaseArgsMother';

describe('UpdatePillarUseCase', () => {
  it('should update pillar', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const pillar = PillarMother.basic().withDisabled(false).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withPillarBody({
        disabled: true,
      })
      .build();

    await useCase.updatePillar(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
    });
    expect(updatedAssessment).toBeDefined();
    expect(updatedAssessment?.pillars?.[0].disabled).toBe(true);
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdatePillarUseCaseArgsMother.basic().build();

    await expect(useCase.updatePillar(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw PillarNotFoundError if pillar does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId('pillar-id')
      .build();

    await expect(useCase.updatePillar(input)).rejects.toThrow(
      PillarNotFoundError,
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new UpdatePillarUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
