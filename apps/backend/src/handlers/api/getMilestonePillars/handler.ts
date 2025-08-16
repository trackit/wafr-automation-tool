import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetMilestonePillarsAdapter } from './GetMilestonePillarsAdapter';

const adapter = new GetMilestonePillarsAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
