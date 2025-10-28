import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { UpdateBestPracticeAdapter } from './UpdateBestPracticeAdapter';

const adapter = new UpdateBestPracticeAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
