import { CountryCode, Industry } from '@aws-sdk/client-partnercentral-selling';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { CustomerType } from '@backend/models';
import { tokenCreateOpportunityUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const CreateOpportunityPathSchema = z.object({
  assessmentId: z.uuid(),
}) satisfies ZodType<operations['createOpportunity']['parameters']['path']>;

const CreateOpportunityBodySchema = z.object({
  companyName: z.string(),
  duns: z.string(),
  industry: z.enum(Industry),
  customerType: z.enum(CustomerType),
  companyWebsiteUrl: z.string(),
  customerCountry: z.enum(CountryCode),
  customerPostalCode: z.string(),
  monthlyRecurringRevenue: z.string(),
  targetCloseDate: z.string(),
  customerCity: z.string().optional(),
  customerAddress: z.string().optional(),
}) satisfies ZodType<
  operations['createOpportunity']['requestBody']['content']['application/json']
>;

export class CreateOpportunityAdapter {
  private readonly useCase = inject(tokenCreateOpportunityUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = parseApiEvent(event, {
      pathSchema: CreateOpportunityPathSchema,
      bodySchema: CreateOpportunityBodySchema,
    });

    await this.useCase.createOpportunity({
      ...pathParameters,
      opportunityDetails: body,
      user: getUserFromEvent(event),
    });
  }
}
