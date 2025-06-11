export class ServerError extends Error {
  public readonly description?: string;

  public constructor({
    message,
    description,
    name = 'ServerError',
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

export class NoContentError extends ServerError {
  public constructor(description?: string) {
    super({
      message: 'No Content',
      name: 'NoContentError',
      description,
    });
  }
}

export class NotFoundError extends ServerError {
  public constructor(description?: string) {
    super({
      message: 'Not Found',
      name: 'NotFoundError',
      description,
    });
  }
}

export class ConflictError extends ServerError {
  public constructor(description?: string) {
    super({
      message: 'Conflict',
      name: 'ConflictError',
      description,
    });
  }
}

export class InvalidParametersError extends ServerError {
  public constructor(description?: string) {
    super({
      message: 'Invalid parameters',
      name: 'InvalidParametersError',
      description,
    });
  }
}
