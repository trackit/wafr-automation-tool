import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentVersionMother,
  PillarMother,
  QuestionMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../errors';
import { UpdateQuestionUseCaseImpl } from './UpdateQuestionUseCase';
import { UpdateQuestionUseCaseArgsMother } from './UpdateQuestionUseCaseArgsMother';

describe('UpdateQuestionUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = UpdateQuestionUseCaseArgsMother.basic().build();

    await expect(useCase.updateQuestion(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should throw PillarNotFoundError if pillar does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withLatestVersionNumber(1)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withVersion(assessment.latestVersionNumber)
      .withPillars([])
      .build();
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: user.organizationDomain,
    });

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId('pillar-id')
      .withQuestionId('question-id')
      .build();

    await expect(useCase.updateQuestion(input)).rejects.toThrow(
      PillarNotFoundError,
    );
  });

  it('should throw QuestionNotFoundError if question does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const pillar = PillarMother.basic().withQuestions([]).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withLatestVersionNumber(1)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withVersion(assessment.latestVersionNumber)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: user.organizationDomain,
    });

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId('question-id')
      .build();

    await expect(useCase.updateQuestion(input)).rejects.toThrow(
      QuestionNotFoundError,
    );
  });

  it('should update question', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const question = QuestionMother.basic()
      .withId('question-id')
      .withDisabled(false)
      .withNone(false)
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .withLatestVersionNumber(1)
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withVersion(assessment.latestVersionNumber)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: user.organizationDomain,
    });

    const input = UpdateQuestionUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withUser(user)
      .withPillarId(pillar.id)
      .withQuestionId(question.id)
      .withDisabled(true)
      .withNone(true)
      .build();

    await useCase.updateQuestion(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
    });
    expect(updatedAssessment).toBeDefined();
    expect(updatedAssessment?.pillars?.[0].questions?.[0]).toEqual(
      expect.objectContaining({
        id: question.id,
        disabled: true,
        none: true,
      }),
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
