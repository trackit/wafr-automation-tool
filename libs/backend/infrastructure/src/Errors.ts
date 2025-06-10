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
  public constructor(description?: string) {
    super({
      message: 'Assessment not found',
      name: 'AssessmentNotFoundError',
      description,
    });
  }
}

export class PillarNotFoundError extends InfrastructureError {
  public constructor(description?: string) {
    super({
      message: 'Pillar not found',
      name: 'PillarNotFoundError',
      description,
    });
  }
}

export class QuestionNotFoundError extends InfrastructureError {
  public constructor(description?: string) {
    super({
      message: 'Question not found',
      name: 'QuestionNotFoundError',
      description,
    });
  }
}

export class BestPracticeNotFoundError extends InfrastructureError {
  public constructor(description?: string) {
    super({
      message: 'Best Practice not found',
      name: 'BestPracticeNotFoundError',
      description,
    });
  }
}

export class NoUpdateBodyError extends InfrastructureError {
  public constructor(description?: string) {
    super({
      message: 'No update body',
      name: 'NoUpdateBodyError',
      description,
    });
  }
}
