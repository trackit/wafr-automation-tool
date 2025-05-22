import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { StartAssessmentAdapter } from './startAssessment.adapter';

const adapter = new StartAssessmentAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
