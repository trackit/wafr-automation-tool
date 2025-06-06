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
