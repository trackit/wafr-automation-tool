import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetAssessmentVersionsAdapter } from './GetAssessmentVersionsAdapter';

const adapter = new GetAssessmentVersionsAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
