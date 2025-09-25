import { CountryCode, Industry } from '@aws-sdk/client-partnercentral-selling';
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
  assessmentId: z.string().uuid(),
}) satisfies ZodType<operations['createOpportunity']['parameters']['path']>;

const CreateOpportunityBodySchema = z.object({
  companyName: z.string(),
  duns: z.string(),
  industry: z.string(),
  customerType: z.nativeEnum(CustomerType),
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

function isIndustry(value: string): value is Industry {
  return Object.values(Industry).includes(value as Industry);
}

function isCountryCode(value: string): value is CountryCode {
  return Object.values(CountryCode).includes(value as CountryCode);
}

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
      if (!isCountryCode(parsedBody.customerCountry)) {
        throw new BadRequestError(
          `Invalid country code: ${parsedBody.customerCountry}`
        );
      }
      if (!isIndustry(parsedBody.industry)) {
        throw new BadRequestError(`Invalid industry: ${parsedBody.industry}`);
      }
      await this.useCase.createOpportunity({
        ...parsedPath,
        opportunityDetails: {
          ...parsedBody,
          customerType: parsedBody.customerType as CustomerType,
          customerCountry: parsedBody.customerCountry as CountryCode,
          industry: parsedBody.industry as Industry,
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
