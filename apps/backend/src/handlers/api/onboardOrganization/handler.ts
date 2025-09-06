import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { OnboardOrganization, } from './onboardOrganization';

const adapter = new OnboardOrganization();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
