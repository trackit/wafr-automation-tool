import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetAllAssessmentsAdapter } from './GetAssessmentsAdapter';

const adapter = new GetAllAssessmentsAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
