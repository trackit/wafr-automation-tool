import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { CreateOpportunityAdapter } from './CreateOpportunityAdapter';

const adapter = new CreateOpportunityAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
