import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  NoUpdateBodyError,
  PillarNotFoundError,
  QuestionNotFoundError,
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../Errors';
import { UpdateBestPracticeUseCaseImpl } from './UpdateBestPracticeUseCase';
import { UpdateBestPracticeUseCaseArgsMother } from './UpdateBestPracticeUseCaseArgsMother';

describe('UpdateBestPracticeUseCase', () => {
  it('should update best practice', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment-id')
      .withOrganization('other-org.io')
      .withFindings([
        PillarMother.basic()
          .withId('1')
          .withQuestions([
            QuestionMother.basic()
              .withId('1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('1')
                  .withStatus(false)
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      assessment;

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withQuestionId('1')
      .withBestPracticeId('1')
      .withBestPracticeBody({
        status: true,
      })
      .build();

    await expect(useCase.updateBestPractice(input)).resolves.not.toThrow();
    expect(
      fakeAssessmentsRepository.updateBestPractice
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        assessmentId: 'assessment-id',
        bestPracticeId: '1',
        bestPracticeBody: {
          status: true,
        },
        pillarId: '1',
        questionId: '1',
        organization: 'other-org.io',
      })
    );
  });

  it('should throw a NotFoundError if the infrastructure throws AssessmentNotFoundError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().build())
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      NotFoundError
    );
    await expect(
      fakeAssessmentsRepository.updateBestPractice({
        organization: input.user.organizationDomain,
        ...input,
      })
    ).rejects.toThrow(AssessmentNotFoundError);
  });

  it('should throw a NotFoundError if the infrastructure throws PillarNotFoundError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withBestPracticeBody({
        status: true,
      })
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      NotFoundError
    );
    await expect(
      fakeAssessmentsRepository.updateBestPractice({
        organization: input.user.organizationDomain,
        ...input,
      })
    ).rejects.toThrow(PillarNotFoundError);
  });

  it('should throw a NotFoundError if the infrastructure throws QuestionNotFoundError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .withFindings([PillarMother.basic().withId('1').build()])
        .build();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withQuestionId('1')
      .withBestPracticeBody({
        status: true,
      })
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      NotFoundError
    );
    await expect(
      fakeAssessmentsRepository.updateBestPractice({
        organization: input.user.organizationDomain,
        ...input,
      })
    ).rejects.toThrow(QuestionNotFoundError);
  });

  it('should throw a NotFoundError if the infrastructure throws BestPracticeNotFoundError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .withFindings([
          PillarMother.basic()
            .withId('1')
            .withQuestions([QuestionMother.basic().withId('1').build()])
            .build(),
        ])
        .build();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withQuestionId('1')
      .withBestPracticeId('1')
      .withBestPracticeBody({
        status: true,
      })
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      NotFoundError
    );
    await expect(
      fakeAssessmentsRepository.updateBestPractice({
        organization: input.user.organizationDomain,
        ...input,
      })
    ).rejects.toThrow(BestPracticeNotFoundError);
  });

  it('should throw a NoUpdateBodyError if the infrastructure throws EmptyUpdateBodyError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withBestPracticeBody({})
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      NoContentError
    );
    await expect(
      fakeAssessmentsRepository.updateBestPractice({
        organization: input.user.organizationDomain,
        ...input,
      })
    ).rejects.toThrow(NoUpdateBodyError);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeAssessmentsRepository = inject(tokenFakeAssessmentsRepository);
  vitest.spyOn(fakeAssessmentsRepository, 'updateBestPractice');
  return {
    useCase: new UpdateBestPracticeUseCaseImpl(),
    fakeAssessmentsRepository: fakeAssessmentsRepository,
  };
};
