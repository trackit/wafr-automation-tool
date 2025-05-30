import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { tokenLogger } from '@backend/infrastructure';
import { NotFoundError, ServerError } from '@backend/useCases';
import { inject } from '@shared/di-container';
import { HttpError } from './HttpError';

const ServerErrorStatusCode = {
  [NotFoundError.name]: 404,
};

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
    return {
      statusCode,
      body: JSON.stringify(await func(event)),
    };
  } catch (e: unknown) {
    if (e instanceof ServerError) {
      logger.error('ServerError', e);
      const statusCode = ServerErrorStatusCode[e.name] || 400;
      return {
        statusCode: statusCode,
        body: JSON.stringify({
          message: e.message,
          description: e.description,
        }),
      };
    } else if (e instanceof HttpError) {
      logger.error('HttpError', e);
      return {
        statusCode: e.code,
        body: JSON.stringify({
          message: e.message,
          description: e.description,
        }),
      };
    }
    logger.error('Internal Server Error', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error.' }),
    };
  }
};
