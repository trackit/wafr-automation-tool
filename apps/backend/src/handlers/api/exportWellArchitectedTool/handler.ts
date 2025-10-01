import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { ExportWellArchitectedToolAdapter } from './ExportWellArchitectedToolAdapter';

const adapter = new ExportWellArchitectedToolAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
