import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { tokenLogger } from '@backend/infrastructure';
import { inject } from '@shared/di-container';
import { BasicError, BasicErrorType } from '@shared/utils';

const ErrorTypeResponseCode: Record<BasicErrorType, number> = {
  [BasicErrorType.BAD_REQUEST]: 400,
  [BasicErrorType.FORBIDDEN]: 403,
  [BasicErrorType.NOT_FOUND]: 404,
  [BasicErrorType.CONFLICT]: 409,
};

const buildResponse = (
  statusCode: number,
  body: unknown = {},
): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(body),
  headers: {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
});

export const handleHttpRequest = async ({
  event,
  func,
  statusCode = 200,
}: {
  event: APIGatewayProxyEvent;
  func: (event: APIGatewayProxyEvent) => Promise<unknown>;
  statusCode?: number;
}): Promise<APIGatewayProxyResult> => {
  const logger = inject(tokenLogger);
  try {
    logger.info(`[${event.requestContext.httpMethod}] ${event.path}`, {
      event,
    });
    return buildResponse(statusCode, await func(event));
  } catch (e: unknown) {
    if (e instanceof BasicError) {
      const httpStatus = ErrorTypeResponseCode[e.type];

      logger.error(`${e.code}Error`, {
        type: e.type,
        message: e.message,
        description: e.description,
      });
      return buildResponse(httpStatus, {
        code: e.code,
        message: e.message,
        description: e.description,
      });
    }
    logger.error('Internal Server Error', e);

    throw e;
  }
};
