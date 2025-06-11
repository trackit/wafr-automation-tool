export class InfrastructureError extends Error {
  public readonly description?: string;

  public constructor({
    message,
    description,
    name = 'InfrastructureError',
  }: {
    message: string;
    name?: string;
    description?: string;
  }) {
    super(message);
    this.description = description;
    this.name = name;
  }
}

export class InvalidNextTokenError extends InfrastructureError {
  public constructor(description?: string) {
    super({
      message: 'Invalid next token',
      name: 'InvalidNextTokenError',
      description,
    });
  }
}

export class AssessmentNotFoundError extends InfrastructureError {
  public constructor(args: { assessmentId: string; organization: string }) {
    super({
      message: `Assessment with id ${args.assessmentId} not found for organization ${args.organization}`,
      name: 'AssessmentNotFoundError',
    });
  }
}

export class PillarNotFoundError extends InfrastructureError {
  public constructor(args: { assessmentId: string; pillarId: string }) {
    super({
      message: `Pillar with id ${args.pillarId} not found for assessment ${args.assessmentId}`,
      name: 'PillarNotFoundError',
    });
  }
}

export class QuestionNotFoundError extends InfrastructureError {
  public constructor(args: {
    assessmentId: string;
    pillarId: string;
    questionId: string;
  }) {
    super({
      message: `Question with id ${args.questionId} not found for assessment ${args.assessmentId} and pillar ${args.pillarId}`,
      name: 'QuestionNotFoundError',
    });
  }
}

export class BestPracticeNotFoundError extends InfrastructureError {
  public constructor(args: {
    assessmentId: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }) {
    super({
      message: `Best Practice with id ${args.bestPracticeId} not found for assessment ${args.assessmentId} and pillar ${args.pillarId} and question ${args.questionId}`,
      name: 'BestPracticeNotFoundError',
    });
  }
}

export class EmptyUpdateBodyError extends InfrastructureError {
  public constructor(description?: string) {
    super({
      message: 'Empty update body',
      name: 'EmptyUpdateBodyError',
      description,
    });
  }
}
