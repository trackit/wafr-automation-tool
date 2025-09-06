import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { tokenOnboardOrganizationUseCase } from '@backend/useCases';
import { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { parseJsonObject } from '@shared/utils';
import z, { ZodType } from 'zod';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

const OnboardOrganizationArgsSchema = z.object({
  accountId: z.string(),
}) satisfies ZodType<
  operations['startOrganizationOnboarding']['requestBody']['content']['application/json']
>;

export class OnboardOrganization {
  private readonly onboardOrganizationUseCase = inject(
    tokenOnboardOrganizationUseCase
  );

  private parseBody(
    body?: string
  ): operations['startOrganizationOnboarding']['requestBody']['content']['application/json'] {
    const parsedBody = parseJsonObject(body);
    return OnboardOrganizationArgsSchema.parse(parsedBody);
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

  private async processRequest(event: APIGatewayProxyEvent) {
    const { body } = event;
    if (!body) {
      throw new Error('Request body is required');
    }

    const user = getUserFromEvent(event);
    const parsedBody = this.parseBody(body);
    await this.onboardOrganizationUseCase.onboardOrganization({
      organizationDomain: user.organizationDomain,
      ...parsedBody,
    });
  }
}
