import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { GetAssessmentUseCaseImpl } from './GetAssessmentUseCase';
import { GetAssessmentUseCaseArgsMother } from './GetAssessmentUseCaseArgsMother';

describe('GetAssessmentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GetAssessmentUseCaseArgsMother.basic().build();

    await expect(useCase.getAssessment(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should return the assessment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    const result = await useCase.getAssessment(input);

    expect(result.assessment).toEqual(assessment);
    expect(result.bestPracticesFindingsAmount).toEqual({});
  });

  it('should return correct bestPracticesFindingsAmount', async () => {
    const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
      setup();

    const bestPractice = BestPracticeMother.basic().build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic().withPillars([pillar]).build();

    await fakeAssessmentsRepository.save(assessment);

    vitest
      .spyOn(fakeFindingsRepository, 'countBestPracticeFindings')
      .mockResolvedValue(3);

    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    const result = await useCase.getAssessment(input);
    expect(result.assessment).toEqual(assessment);
    expect(
      result.bestPracticesFindingsAmount[pillar.id][question.id][
        bestPractice.id
      ],
    ).toBe(3);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetAssessmentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
