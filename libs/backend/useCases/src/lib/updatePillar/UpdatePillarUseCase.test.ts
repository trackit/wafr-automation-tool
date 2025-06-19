import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { AssessmentMother, PillarMother, UserMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../Errors';
import { UpdatePillarUseCaseImpl } from './UpdatePillarUseCase';
import { UpdatePillarUseCaseArgsMother } from './UpdatePillarUseCaseArgsMother';

describe('UpdatePillarUseCase', () => {
  it('should update pillar', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('other-org.io')
      .withFindings([
        PillarMother.basic().withId('1').withDisabled(false).build(),
      ])
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      assessment;

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
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
        assessmentId: 'assessment-id',
        organization: 'other-org.io',
        pillarId: '1',
        pillarBody: {
          disabled: true,
        },
      })
    );
  });

  it('should throw a NotFoundError if the infrastructure throws AssessmentNotFoundError', async () => {
    const { useCase } = setup();

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().build())
      .build();

    await expect(useCase.updatePillar(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if the infrastructure throws PillarNotFoundError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withPillarBody({
        disabled: true,
      })
      .build();

    await expect(useCase.updatePillar(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NoUpdateBodyError if the infrastructure throws EmptyUpdateBodyError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = UpdatePillarUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarBody({})
      .build();

    await expect(useCase.updatePillar(input)).rejects.toThrow(NoContentError);
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
