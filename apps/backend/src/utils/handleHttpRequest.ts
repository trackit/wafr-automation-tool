import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { HttpError } from '@backend/errors';
import { tokenLogger } from '@backend/infrastructure';
import { inject } from '@shared/di-container';

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
    if (e instanceof HttpError) {
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
