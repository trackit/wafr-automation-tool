import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { tokenLogger } from '@backend/infrastructure';
import { inject } from '@shared/di-container';
import { BasicError, BasicErrorType } from '@shared/utils';

const CATEGORY_TO_HTTP = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const satisfies Record<BasicErrorType, number>;

const buildResponse = (
  statusCode: number,
  body: unknown = {}
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
      const httpStatus = CATEGORY_TO_HTTP[e.type];

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
    console.log(e);
    logger.error('Internal Server Error', e);
    return buildResponse(500, {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error.',
      description: 'An unexpected error occurred.',
    });
  }
};
