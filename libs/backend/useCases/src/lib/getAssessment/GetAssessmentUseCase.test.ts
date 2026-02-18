import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentVersionMother,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  DatabaseUnavailableError,
} from '../../errors';
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

  it('should throw DatabaseUnavailableError if database is unavailable', async () => {
    const { useCase } = setup();
    const connectionRefusedError = {
      code: 'ECONNREFUSED',
      errno: -111,
      message: 'connect ECONNREFUSED',
    };

    vitest
      .spyOn(useCase['assessmentsRepository'], 'get')
      .mockRejectedValue(connectionRefusedError);
    const input = GetAssessmentUseCaseArgsMother.basic().build();

    await expect(useCase.getAssessment(input)).rejects.toThrow(
      DatabaseUnavailableError,
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
    vitest.useFakeTimers();
    try {
      const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
        setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic().withPillars([pillar]).build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withPillars([pillar])
        .withVersion(assessment.latestVersionNumber)
        .build();
      await fakeAssessmentsRepository.save(assessment);
      await fakeAssessmentsRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });
      const finding1 = FindingMother.basic()
        .withId('finding#1')
        .withVersion(assessment.latestVersionNumber)
        .build();
      const finding2 = FindingMother.basic()
        .withId('finding#2')
        .withVersion(assessment.latestVersionNumber)
        .build();
      const finding3 = FindingMother.basic()
        .withId('finding#3')
        .withVersion(assessment.latestVersionNumber + 1)
        .build();

      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });
      await fakeFindingsRepository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding3,
      });

      await fakeFindingsRepository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      await fakeFindingsRepository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber + 1,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding3.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];
      finding3.bestPractices = [bestPractice];

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
      ).toBe(2);
    } finally {
      vitest.useRealTimers();
    }
  });

  it('calls repository with provided version when version is specified', async () => {
    const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
      setup();

    const bestPractice = BestPracticeMother.basic().build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();

    const assessment = AssessmentMother.basic()
      .withLatestVersionNumber(3)
      .build();

    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withVersion(2)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: assessment.organization,
    });

    const getSpy = vitest.spyOn(fakeAssessmentsRepository, 'get');
    const countBestPracticeFindingsSpy = vitest.spyOn(
      fakeFindingsRepository,
      'countBestPracticeFindings',
    );
    const input = GetAssessmentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withVersion(2)
      .build();

    await useCase.getAssessment(input);

    expect(getSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: 2 }),
    );
    expect(countBestPracticeFindingsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ version: 2 }),
    );
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
