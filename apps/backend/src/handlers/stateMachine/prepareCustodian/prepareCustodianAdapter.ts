import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleHttpRequest } from '../../../utils/api/handleHttpRequest';
import type { operations } from '@shared/api-schema';
import { inject } from '@shared/di-container';
import { tokenPrepareCustodianUseCase } from '@backend/useCases';

export class prepareCustodianAdapter {
  private readonly useCase = inject(tokenPrepareCustodianUseCase);

  public async handle(): Promise<string> {
    return await this.useCase.prepareCustodian();
  }
}
