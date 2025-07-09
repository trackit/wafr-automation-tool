import {
  AssessmentMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import {
  EmptyUpdateBodyError,
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { NoContentError, NotFoundError } from '../Errors';
import { UpdateQuestionUseCaseImpl } from './UpdateQuestionUseCase';
import { UpdateQuestionUseCaseArgsMother } from './UpdateQuestionUseCaseArgsMother';

describe('UpdateQuestionUseCase', () => {
  it('should throw a NotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdateQuestionUseCaseArgsMother.basic().build();
    await expect(useCase.updateQuestion(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if assessment exist for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.updateQuestion(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if pillar does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars([])
        .build();

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withPillarId('pillar-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.updateQuestion(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if question does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars([
          PillarMother.basic().withId('pillar-id').withQuestions([]).build(),
        ])
        .build();

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.updateQuestion(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NoContentError if repository throws an EmptyUpdateBodyError', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    fakeAssessmentsRepository.updateQuestion = vi
      .fn()
      .mockRejectedValue(new EmptyUpdateBodyError());

    await expect(useCase.updateQuestion(input)).rejects.toThrow(NoContentError);
  });

  it('should update question', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars([
          PillarMother.basic()
            .withId('pillar-id')
            .withQuestions([
              QuestionMother.basic()
                .withId('question-id')
                .withDisabled(false)
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .build();

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withDisabled(true)
      .withNone(true)
      .build();
    await useCase.updateQuestion(input);

    const updatedQuestion =
      fakeAssessmentsRepository.assessments['assessment-id#test.io']
        ?.pillars?.[0].questions?.[0];
    expect(updatedQuestion).toEqual(
      expect.objectContaining({
        id: 'question-id',
        disabled: true,
        none: true,
      })
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new UpdateQuestionUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
