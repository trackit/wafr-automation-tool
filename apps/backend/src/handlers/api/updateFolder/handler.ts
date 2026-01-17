import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { UpdateFolderAdapter } from './UpdateFolderAdapter';

const adapter = new UpdateFolderAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
