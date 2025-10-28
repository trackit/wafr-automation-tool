import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { UpdatePillarAdapter } from './UpdatePillarAdapter';

const adapter = new UpdatePillarAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
