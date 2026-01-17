import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DeleteFolderAdapter } from './DeleteFolderAdapter';

const adapter = new DeleteFolderAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
