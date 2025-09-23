import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { StartPDFExportAdapter } from './StartPDFExportAdapter';

const adapter = new StartPDFExportAdapter();

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => adapter.handle(event);
