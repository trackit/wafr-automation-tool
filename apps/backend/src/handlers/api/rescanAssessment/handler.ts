import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { RescanAssessmentAdapter } from './RescanAssessmentAdapter';

const adapter = new RescanAssessmentAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
