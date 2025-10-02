import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { ListPDFExportsAdapter } from './ListPDFExportsAdapter';

const adapter = new ListPDFExportsAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
