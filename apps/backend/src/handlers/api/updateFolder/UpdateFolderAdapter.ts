import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenUpdateFolderUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const UpdateFolderPathSchema = z.object({
  folderName: z.string().min(1),
}) satisfies ZodType<operations['updateFolder']['parameters']['path']>;

const UpdateFolderBodySchema = z.object({
  name: z.string().min(1),
}) satisfies ZodType<
  operations['updateFolder']['requestBody']['content']['application/json']
>;

export class UpdateFolderAdapter {
  private readonly useCase = inject(tokenUpdateFolderUseCase);

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
      pathSchema: UpdateFolderPathSchema,
      bodySchema: UpdateFolderBodySchema,
    });

    const user = getUserFromEvent(event);

    await this.useCase.updateFolder({
      organizationDomain: user.organizationDomain,
      oldFolderName: decodeURIComponent(pathParameters.folderName),
      newFolderName: body.name,
    });
  }
}
