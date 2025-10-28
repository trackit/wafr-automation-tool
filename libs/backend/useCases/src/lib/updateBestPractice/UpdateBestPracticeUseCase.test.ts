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

    const user = UserMother.basic().build();

    const bestPractice = BestPracticeMother.basic().withChecked(false).build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId(question.id)
      .withBestPracticeId(bestPractice.id)
      .withBestPracticeBody({
        checked: true,
      })
      .build();

    await useCase.updateBestPractice(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
    });
    expect(updatedAssessment).toEqual(
      expect.objectContaining({
        id: assessment.id,
        pillars: [
          expect.objectContaining({
            id: pillar.id,
            questions: [
              expect.objectContaining({
                id: question.id,
                bestPractices: [
                  expect.objectContaining({
                    id: bestPractice.id,
                    checked: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  });

  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdateBestPracticeUseCaseArgsMother.basic().build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
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

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      PillarNotFoundError,
    );
  });

  it('should throw QuestionNotFoundError if question does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const pillar = PillarMother.basic().build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      QuestionNotFoundError,
    );
  });

  it('should throw BestPracticeNotFoundError if best practice does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const question = QuestionMother.basic().build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = UpdateBestPracticeUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId(question.id)
      .withBestPracticeId('best-practice-id')
      .build();

    await expect(useCase.updateBestPractice(input)).rejects.toThrow(
      BestPracticeNotFoundError,
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new UpdateBestPracticeUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
