import {
  AssessmentMother,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { NotFoundError } from '../Errors';
import { GetBestPracticeFindingsUseCaseImpl } from './GetBestPracticeFindingsUseCase';
import { GetBestPracticeFindingsUseCaseArgsMother } from './GetBestPracticeFindingsUseCaseArgsMother';

describe('GetBestPracticeFindings UseCase', () => {
  it('should throw a NotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic().build();
    fakeAssessmentsRepository.assessments = {};
    fakeAssessmentsRepository.assessmentFindings = {};

    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a NotFoundError if assessment exist for another organization', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#other-org.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('other-org.io')
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#other-org.io'] =
      [FindingMother.basic().build()];

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();
    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should throw a NotFoundError if either pillar question or best practice do not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
        .withOrganization('test.io')
        .withPillars([
          PillarMother.basic()
            .withId('other-pillar-id')
            .withQuestions([
              QuestionMother.basic()
                .withId('other-question-id')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('other-best-practice-id')
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic().build(),
    ];

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .withAssessmentId('assessment-id')
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();
    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should return an empty array if no findings exist', async () => {
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
                .withBestPractices([
                  BestPracticeMother.basic().withId('best-practice-id').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [];

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
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

    fakeAssessmentsRepository.assessments['assessment-id#test.io'] =
      AssessmentMother.basic()
        .withId('assessment-id')
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
    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
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
      .withAssessmentId('assessment-id')
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
