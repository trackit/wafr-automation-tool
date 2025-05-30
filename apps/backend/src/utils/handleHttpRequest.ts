import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { tokenLogger } from '@backend/infrastructure';
import { NotFoundError, ServerError } from '@backend/useCases';
import { inject } from '@shared/di-container';
import { HttpError } from './HttpError';

const ServerErrorStatusCode = {
  [NotFoundError.name]: 404,
};

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
    if (e instanceof ServerError) {
      logger.error('ServerError', e);
      const statusCode = ServerErrorStatusCode[e.name] || 400;
      return buildResponse(statusCode, {
        message: e.message,
        description: e.description,
      });
    } else if (e instanceof HttpError) {
      logger.error('HttpError', e);
      return buildResponse(e.code, {
        message: e.message,
        description: e.description,
      });
    }
    logger.error('Internal Server Error', e);
    return buildResponse(500, {
      message: 'Internal Server Error.',
      description: 'An unexpected error occurred.',
    });
  }
};
