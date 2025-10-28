import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { GeneratePDFExportURLAdapter } from './GeneratePDFExportURLAdapter';

const adapter = new GeneratePDFExportURLAdapter();

export const main = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => adapter.handle(event);
