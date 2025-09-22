import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, ZodError, ZodType } from 'zod';

import { CustomerType } from '@backend/models';
import { tokenCreateOpportunityUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { BadRequestError } from '../../../utils/api/HttpError';

const CreateOpportunityPathSchema = z.object({
  assessmentId: z.string(),
}) satisfies ZodType<operations['createOpportunity']['parameters']['path']>;

const CreateOpportunityBodySchema = z.object({
  companyName: z.string(),
  duns: z.string(),
  industry: z.string(),
  customerType: z.enum(['INTERNAL_WORKLOAD', 'CUSTOMER']),
  companyWebsiteUrl: z.string(),
  customerCountry: z.string(),
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

  private parseBody(
    body?: string
  ): operations['createOpportunity']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return CreateOpportunityBodySchema.parse(parsedBody);
  }

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }
  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { pathParameters, body } = event;
    try {
      const parsedPath = CreateOpportunityPathSchema.parse(pathParameters);
      const parsedBody = this.parseBody(body ?? undefined);
      await this.useCase.createOpportunity({
        ...parsedPath,
        opportunityDetails: {
          ...parsedBody,
          customerType: parsedBody.customerType as CustomerType,
        },
        user: getUserFromEvent(event),
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestError(`Invalid request query: ${e.message}`);
      }
      throw e;
    }
  }
}
