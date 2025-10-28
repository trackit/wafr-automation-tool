import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { UpdateQuestionAdapter } from './UpdateQuestionAdapter';

const adapter = new UpdateQuestionAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
