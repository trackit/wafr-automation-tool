import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetBestPracticeFindingsAdapter } from './GetBestPracticeFindingsAdapter';

const adapter = new GetBestPracticeFindingsAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
