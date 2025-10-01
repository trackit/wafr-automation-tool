import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetMilestoneAdapter } from './GetMilestoneAdapter';

const adapter = new GetMilestoneAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
