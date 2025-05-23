import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DeleteAssessmentAdapter } from './deleteAssessment.adapter';

const adapter = new DeleteAssessmentAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
