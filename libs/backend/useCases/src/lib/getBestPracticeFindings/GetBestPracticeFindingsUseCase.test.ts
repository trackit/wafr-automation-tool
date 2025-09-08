import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  BestPracticeMother,
  FindingMother,
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
import { GetBestPracticeFindingsUseCaseImpl } from './GetBestPracticeFindingsUseCase';
import { GetBestPracticeFindingsUseCaseArgsMother } from './GetBestPracticeFindingsUseCaseArgsMother';

describe('GetBestPracticeFindings UseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
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

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
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

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
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

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
      BestPracticeNotFoundError
    );
  });

  it('should return an empty array if no findings exist', async () => {
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
              .withBestPractices([
                BestPracticeMother.basic().withId('best-practice-id').build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build();
    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [];

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    const { findings } = await useCase.getBestPracticeFindings(input);
    expect(findings).toEqual([]);
  });

  it('should return the existing findings', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('test.io')
      .withPillars([
        PillarMother.basic()
          .withId('0')
          .withQuestions([
            QuestionMother.basic()
              .withId('1')
              .withBestPractices([
                BestPracticeMother.basic().withId('2').build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build();
    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [
      FindingMother.basic()
        .withBestPractices('0#1#2')
        .withId('finding-id')
        .build(),
      FindingMother.basic()
        .withBestPractices('0#1#2')
        .withId('other-finding-id')
        .build(),
      FindingMother.basic()
        .withBestPractices('0#1#2')
        .withId('another-finding-id')
        .build(),
    ];

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withPillarId('0')
      .withQuestionId('1')
      .withBestPracticeId('2')
      .build();
    const { findings } = await useCase.getBestPracticeFindings(input);
    expect(findings).toEqual([
      expect.objectContaining({ id: 'finding-id' }),
      expect.objectContaining({ id: 'other-finding-id' }),
      expect.objectContaining({ id: 'another-finding-id' }),
    ]);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new GetBestPracticeFindingsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
