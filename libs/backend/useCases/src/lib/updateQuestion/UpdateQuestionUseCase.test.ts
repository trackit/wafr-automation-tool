import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError, PillarNotFoundError, QuestionNotFoundError } from '../../errors';
import { UpdateQuestionUseCaseImpl } from './UpdateQuestionUseCase';
import { UpdateQuestionUseCaseArgsMother } from './UpdateQuestionUseCaseArgsMother';

describe('UpdateQuestionUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = UpdateQuestionUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.updateQuestion(input)).rejects.toThrow(
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

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .build();
    await expect(useCase.updateQuestion(input)).rejects.toThrow(
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

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .build();
    await expect(useCase.updateQuestion(input)).rejects.toThrow(
      QuestionNotFoundError
    );
  });

  it('should update question', async () => {
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
              .withDisabled(false)
              .withNone(false)
              .build(),
          ])
          .build(),
      ])
      .build();

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withDisabled(true)
      .withNone(true)
      .build();
    await useCase.updateQuestion(input);

    const updatedQuestion =
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
      ]?.pillars?.[0].questions?.[0];
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
