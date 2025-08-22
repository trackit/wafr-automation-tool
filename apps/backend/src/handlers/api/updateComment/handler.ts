import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { UpdateCommentAdapter } from './UpdateCommentAdapter';

const adapter = new UpdateCommentAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
