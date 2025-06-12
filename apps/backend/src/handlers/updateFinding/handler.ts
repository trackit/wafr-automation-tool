import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { UpdateFindingAdapter } from './UpdateFindingAdapter';

const adapter = new UpdateFindingAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
