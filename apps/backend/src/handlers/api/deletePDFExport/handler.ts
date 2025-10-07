import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DeletePDFExportAdapter } from './DeletePDFExportAdapter';

const adapter = new DeletePDFExportAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
