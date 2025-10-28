import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetMilestonesAdapter } from './GetMilestonesAdapter';

const adapter = new GetMilestonesAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
