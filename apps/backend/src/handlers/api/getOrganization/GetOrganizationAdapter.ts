import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { tokenGetOrganizationUseCase } from '@backend/useCases';
import { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

export class GetOrganizationAdapter {
  private readonly useCase = inject(tokenGetOrganizationUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent,
  ): Promise<
    operations['getOrganization']['responses'][200]['content']['application/json']
  > {
    const user = getUserFromEvent(event);

    const organizationDetails = await this.useCase.getOrganizationDetails({
      organizationDomain: user.organizationDomain,
    });

    return organizationDetails;
  }
}
