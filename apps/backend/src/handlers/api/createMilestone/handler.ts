import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { CreateMilestoneAdapter } from './CreateMilestoneAdapter';

const adapter = new CreateMilestoneAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
