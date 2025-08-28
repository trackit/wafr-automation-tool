import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DeleteCommentAdapter } from './DeleteCommentAdapter';

const adapter = new DeleteCommentAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
