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

describe('GetBestPracticeFindingsUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic().build();

    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
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

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();

    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
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

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId('question-id')
      .withBestPracticeId('best-practice-id')
      .build();

    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
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

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId(question.id)
      .withBestPracticeId('best-practice-id')
      .build();

    await expect(useCase.getBestPracticeFindings(input)).rejects.toThrow(
      BestPracticeNotFoundError,
    );
  });

  it('should return an empty array if no findings exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const bestPractice = BestPracticeMother.basic().build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId(question.id)
      .withBestPracticeId(bestPractice.id)
      .build();

    const { findings } = await useCase.getBestPracticeFindings(input);

    expect(findings).toEqual([]);
  });

  it('should return the existing findings', async () => {
    const { useCase, fakeAssessmentsRepository, fakeFindingsRepository } =
      setup();

    const user = UserMother.basic().build();

    const bestPractice = BestPracticeMother.basic().build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: assessment.organization,
    });

    const finding = FindingMother.basic()
      .withId('finding-id')
      .withVersion(assessment.latestVersionNumber)
      .build();
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      finding,
    });
    const finding2 = FindingMother.basic()
      .withId('other-finding-id')
      .withVersion(assessment.latestVersionNumber)
      .build();
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      finding: finding2,
    });
    const finding3 = FindingMother.basic()
      .withId('another-finding-id')
      .withVersion(assessment.latestVersionNumber)
      .build();
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      finding: finding3,
    });

    await fakeFindingsRepository.saveBestPracticeFindings({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      version: assessment.latestVersionNumber,
      pillarId: pillar.id,
      questionId: question.id,
      bestPracticeId: bestPractice.id,
      bestPracticeFindingIds: new Set([finding.id, finding2.id, finding3.id]),
    });

    finding.bestPractices = [bestPractice];
    finding2.bestPractices = [bestPractice];
    finding3.bestPractices = [bestPractice];

    const input = GetBestPracticeFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withVersion(assessment.latestVersionNumber)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId(question.id)
      .withBestPracticeId(bestPractice.id)
      .build();

    const { findings } = await useCase.getBestPracticeFindings(input);
    expect(findings).toEqual([finding, finding2, finding3]);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetBestPracticeFindingsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
