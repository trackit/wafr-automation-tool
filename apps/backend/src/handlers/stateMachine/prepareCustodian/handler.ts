import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { prepareCustodianAdapter } from './prepareCustodianAdapter';

const adapter = new prepareCustodianAdapter();

export const main = async (): Promise<string> => await adapter.handle();
