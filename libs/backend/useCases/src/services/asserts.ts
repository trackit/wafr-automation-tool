import { type Assessment, type Pillar, type Question } from '@backend/models';

import {
  BestPracticeNotFoundError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../errors';

export function assertPillarExists(args: {
  assessment: Assessment;
  pillarId: string;
}): Pillar {
  const { assessment, pillarId } = args;
  const pillar = assessment.pillars?.find(
    (pillar) => pillar.id === pillarId.toString(),
  );
  if (!pillar) {
    throw new PillarNotFoundError({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      pillarId,
    });
  }
  return pillar;
}

export function assertQuestionExists(args: {
  assessment: Assessment;
  pillarId: string;
  questionId: string;
}): Question {
  const { assessment, pillarId, questionId } = args;
  const pillar = assertPillarExists({
    assessment,
    pillarId,
  });
  const question = pillar.questions.find(
    (question) => question.id === questionId,
  );
  if (!question) {
    throw new QuestionNotFoundError({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      pillarId,
      questionId,
    });
  }
  return question;
}

export function assertBestPracticeExists(args: {
  assessment: Assessment;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
}): void {
  const { assessment, pillarId, questionId, bestPracticeId } = args;
  const question = assertQuestionExists({
    assessment,
    pillarId,
    questionId,
  });
  const bestPractice = question.bestPractices.find(
    (bestPractice) => bestPractice.id === bestPracticeId.toString(),
  );
  if (!bestPractice) {
    throw new BestPracticeNotFoundError({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      pillarId,
      questionId,
      bestPracticeId,
    });
  }
}
