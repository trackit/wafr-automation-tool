import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetorganizationStatusAdapter } from './GetOrganizationStatusAdapter';

const adapter = new GetorganizationStatusAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
