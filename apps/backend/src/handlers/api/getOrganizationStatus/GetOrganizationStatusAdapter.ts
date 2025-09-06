import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import type { operations } from '@shared/api-schema';

import { tokenOrganizationRepository } from '@backend/infrastructure';
import { inject } from '@shared/di-container';
import { NotFoundError } from '../../../utils/api/HttpError';
import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';

export class GetorganizationStatusAdapter {
  private readonly organizationRepository = inject(tokenOrganizationRepository);

  public async handle(
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 200,
    });
  }

  private async processRequest(
    event: APIGatewayProxyEvent
  ): Promise<
    operations['getOrganizationStatus']['responses'][200]['content']['application/json']
  > {
    const user = getUserFromEvent(event);

    const organization = await this.organizationRepository.get({
      organizationDomain: user.organizationDomain,
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    return this.organizationRepository.isComplete({ organization })
      ? 'COMPLETED'
      : 'UNCOMPLETED';
  }
}
