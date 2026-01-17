import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenCreateFolderUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const CreateFolderBodySchema = z.object({
  name: z.string().min(1),
}) satisfies ZodType<
  operations['createFolder']['requestBody']['content']['application/json']
>;

export class CreateFolderAdapter {
  private readonly useCase = inject(tokenCreateFolderUseCase);

  public async handle(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    return handleHttpRequest({
      event,
      func: this.processRequest.bind(this),
      statusCode: 201,
    });
  }

  private async processRequest(event: APIGatewayProxyEvent): Promise<void> {
    const { body } = parseApiEvent(event, {
      bodySchema: CreateFolderBodySchema,
    });

    const user = getUserFromEvent(event);

    await this.useCase.createFolder({
      organizationDomain: user.organizationDomain,
      folderName: body.name,
    });
  }
}
