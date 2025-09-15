import { ZodError } from 'zod';

export class HttpError extends Error {
  public readonly code: number;
  public readonly description?: string;

  public constructor({
    code,
    message,
    description,
  }: {
    code: number;
    message: string;
    description?: string;
  }) {
    super();

    this.code = code;
    this.message = message;
    this.description = description;
  }
}

export class BadRequestError extends HttpError {
  public constructor(description?: string) {
    super({
      code: 400,
      message: 'Bad Request',
      description,
    });
  }
}

export class MissingRequestPathError extends BadRequestError {
  public constructor() {
    super('Missing request path');
  }
}

export class MissingRequestBodyError extends BadRequestError {
  public constructor() {
    super('Missing request path');
  }
}

export class RequestParsingFailedError extends BadRequestError {
  public constructor(error: ZodError) {
    super(`Request parsing failed ${error.message}`);
  }
}

export class ForbiddenError extends HttpError {
  public constructor(description?: string) {
    super({
      code: 403,
      message: 'Forbidden',
      description,
    });
  }
}

export class NotFoundError extends HttpError {
  public constructor(description?: string) {
    super({
      code: 404,
      message: 'Not Found',
      description,
    });
  }
}
