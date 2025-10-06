import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetAssessmentGraphAdapter } from './GetAssessmentGraphAdapter';

const adapter = new GetAssessmentGraphAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
