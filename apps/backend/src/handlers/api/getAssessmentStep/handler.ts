import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetAssessmentStepAdapter } from './GetAssessmentStepAdapter';

const adapter = new GetAssessmentStepAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
