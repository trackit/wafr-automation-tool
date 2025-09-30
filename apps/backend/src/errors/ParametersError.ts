import z, { ZodError } from 'zod';

import { BasicErrorType } from '@shared/utils';

import { HandlerError } from './HandlerError';

export class ParametersValidationError extends HandlerError {
  private static pathToString(path?: PropertyKey[]): string {
    if (!path?.length) return '(root)';
    return path
      .map((p) => (typeof p === 'number' ? `[${p}]` : String(p)))
      .join('.');
  }

  constructor(err: ZodError, description?: string) {
    const count = err.issues.length;
    const previews = err.issues
      .map(
        (i) => `${ParametersValidationError.pathToString(i.path)}: ${i.message}`
      )
      .join('; ');
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `Validation failed with ${count} error(s): ${previews}`,
      description: description ?? JSON.stringify(z.treeifyError(err), null, 2),
    });
  }
}

export class ParametersJSONParseError extends HandlerError {
  public constructor(message: string, description?: string) {
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `Failed to parse JSON: ${message}`,
      description,
    });
  }
}

export class BodyMissingError extends HandlerError {
  public constructor(description?: string) {
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `The request body is missing`,
      description,
    });
  }
}

export class PathMissingError extends HandlerError {
  public constructor(description?: string) {
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `The path parameters are missing`,
      description,
    });
  }
}

export class QueryMissingError extends HandlerError {
  public constructor(description?: string) {
    super({
      type: BasicErrorType.BAD_REQUEST,
      message: `The query string parameters are missing`,
      description,
    });
  }
}
