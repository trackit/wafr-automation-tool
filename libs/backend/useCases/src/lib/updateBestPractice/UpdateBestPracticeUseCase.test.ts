import {
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

import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../errors';
import { UpdateBestPracticeUseCaseImpl } from './UpdateBestPracticeUseCase';
import { UpdateBestPracticeUseCaseArgsMother } from './UpdateBestPracticeUseCaseArgsMother';

describe('UpdateBestPracticeUseCase', () => {
  it('should update best practice', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('other-org.io')
      .withPillars([
        PillarMother.basic()
          .withId('1')
          .withQuestions([
            QuestionMother.basic()
              .withId('1')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('1')
                  .withChecked(false)
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#other-org.io'
    ] = assessment;

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(
        UserMother.basic().withOrganizationDomain('other-org.io').build()
      )
      .withPillarId('1')
      .withQuestionId('1')
      .withBestPracticeId('1')
      .withBestPracticeBody({
        checked: true,
      })
      .build();

    await expect(useCase.updateBestPractice(input)).resolves.not.toThrow();
    expect(
      fakeAssessmentsRepository.updateBestPractice
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        bestPracticeId: '1',
        bestPracticeBody: {
          checked: true,
        },
        pillarId: '1',
        questionId: '1',
        organizationDomain: 'other-org.io',
      })
    );
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = UpdateBestPracticeUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
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

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      PillarNotFoundError
    );
  });

  it('should throw QuestionNotFoundError if question does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withPillars([
        PillarMother.basic().withId('pillar-id').withQuestions([]).build(),
      ])
      .build();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      QuestionNotFoundError
    );
  });

  it('should throw BestPracticeNotFoundError if best practice does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withPillars([
        PillarMother.basic()
          .withId('pillar-id')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-id')
              .withBestPractices([])
              .build(),
          ])
          .build(),
      ])
      .build();

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      BestPracticeNotFoundError
    );
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
