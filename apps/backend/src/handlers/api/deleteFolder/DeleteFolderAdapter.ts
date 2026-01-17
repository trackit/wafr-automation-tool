import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z, type ZodType } from 'zod';

import { tokenDeleteFolderUseCase } from '@backend/useCases';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';

import { getUserFromEvent } from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import { parseApiEvent } from '../../../utils/api/parseApiEvent/parseApiEvent';

const DeleteFolderPathSchema = z.object({
  folderName: z.string().min(1),
}) satisfies ZodType<operations['deleteFolder']['parameters']['path']>;

export class DeleteFolderAdapter {
  private readonly useCase = inject(tokenDeleteFolderUseCase);

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
    const { pathParameters } = parseApiEvent(event, {
      pathSchema: DeleteFolderPathSchema,
    });

    const user = getUserFromEvent(event);

    await this.useCase.deleteFolder({
      organizationDomain: user.organizationDomain,
      folderName: decodeURIComponent(pathParameters.folderName),
    });
  }
}
