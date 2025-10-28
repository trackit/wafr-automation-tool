import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GetOrganizationAdapter } from './GetOrganizationAdapter';

const adapter = new GetOrganizationAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
