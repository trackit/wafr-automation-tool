import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { CreateFolderAdapter } from './CreateFolderAdapter';

const adapter = new CreateFolderAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
