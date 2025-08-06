import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { AddCommentAdapter } from './AddComment';

const adapter = new AddCommentAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
