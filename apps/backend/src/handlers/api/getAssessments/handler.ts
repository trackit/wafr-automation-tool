import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetAssessmentsAdapter } from './GetAssessmentsAdapter';

const adapter = new GetAssessmentsAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
