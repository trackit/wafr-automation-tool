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

export class FindingNotFoundError extends InfrastructureError {
  public constructor(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
  }) {
    super({
      message: `Finding with findingId ${args.findingId} not found for assessment ${args.assessmentId} in organization ${args.organization}`,
      name: 'FindingNotFoundError',
    });
  }
}

export class PillarNotFoundError extends InfrastructureError {
  public constructor(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
  }) {
    super({
      message: `Pillar with id ${args.pillarId} not found for assessment ${args.assessmentId} in organization ${args.organization}`,
      name: 'PillarNotFoundError',
    });
  }
}

export class QuestionNotFoundError extends InfrastructureError {
  public constructor(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
  }) {
    super({
      message: `Question with id ${args.questionId} not found for assessment ${args.assessmentId} in organization ${args.organization} and pillar ${args.pillarId}`,
      name: 'QuestionNotFoundError',
    });
  }
}

export class BestPracticeNotFoundError extends InfrastructureError {
  public constructor(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }) {
    super({
      message: `Best Practice with id ${args.bestPracticeId} not found for assessment ${args.assessmentId} in organization ${args.organization} and pillar ${args.pillarId} and question ${args.questionId}`,
      name: 'BestPracticeNotFoundError',
    });
  }
}

export class UserNotFoundError extends InfrastructureError {
  public constructor(args: { userId: string }) {
    super({
      message: `User with id ${args.userId} not found`,
      name: 'UserNotFoundError',
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

export class MilestoneNotFoundError extends InfrastructureError {
  public constructor(args: { assessmentId: string; milestoneId: number }) {
    super({
      message: `Milestone with id ${args.milestoneId} not found for assessment ${args.assessmentId}`,
      name: 'MilestoneNotFoundError',
    });
  }
}

export class WorkloadNotFoundError extends InfrastructureError {
  public constructor(assessmentId: string) {
    super({
      message: `Workload not found for assessment ${assessmentId}`,
      name: 'WorkloadNotFoundError',
    });
  }
}
