import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

export class HttpError extends Error {
  public readonly code: number;
  public readonly message: string;
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

export class NotFoundError extends HttpError {
  public constructor() {
    super({
      code: 404,
      message: 'Not Found',
    });
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

export const handleHttpRequest = async ({
  event,
  func,
  statusCode = 200,
}: {
  event: APIGatewayProxyEventV2;
  func: (event: APIGatewayProxyEventV2) => Promise<unknown>;
  statusCode?: number;
}): Promise<APIGatewayProxyResultV2> => {
  try {
    return {
      statusCode,
      body: JSON.stringify(await func(event)),
    };
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      return {
        statusCode: e.code,
        body: JSON.stringify({
          message: e.message,
          description: e.description,
        }),
      };
    }
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error.' }),
    };
  }
};
