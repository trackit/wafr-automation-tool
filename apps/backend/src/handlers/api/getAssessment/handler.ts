import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetAssessmentAdapter } from './GetAssessmentAdapter';

const adapter = new GetAssessmentAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
