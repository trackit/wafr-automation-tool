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

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('other-org.io')
      .withPillars([
        PillarMother.basic().withId('1').withDisabled(false).build(),
      ])
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#other-org.io'
    ] = assessment;

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withPillarBody({
        disabled: true,
      })
      .build();

    await expect(useCase.updatePillar(input)).resolves.not.toThrow();
    expect(
      fakeAssessmentsRepository.updatePillar
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'other-org.io',
        pillarId: '1',
        pillarBody: {
          disabled: true,
        },
      })
    );
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = UpdatePillarUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.updatePillar(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  it('should throw PillarNotFoundError if pillar does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withPillars([])
      .build();

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withPillarId('pillar-id')
      .build();
    await expect(useCase.updatePillar(input)).rejects.toThrow(
      PillarNotFoundError
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeAssessmentsRepository = inject(tokenFakeAssessmentsRepository);
  vitest.spyOn(fakeAssessmentsRepository, 'updatePillar');
  return {
    useCase: new UpdatePillarUseCaseImpl(),
    fakeAssessmentsRepository: fakeAssessmentsRepository,
  };
};
