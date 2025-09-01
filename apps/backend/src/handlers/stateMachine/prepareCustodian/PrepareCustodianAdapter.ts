import { tokenPrepareCustodianUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export class PrepareCustodianAdapter {
  private readonly useCase = inject(tokenPrepareCustodianUseCase);

  public async handle(): Promise<string> {
    return await this.useCase.prepareCustodian();
  }
}
