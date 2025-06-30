import type { User } from '@backend/models';
import type { PrepareCustodianUseCase } from './PrepareCustodianUseCase';

export class PrepareCustodianUseCaseArgsMother {
  private data: PrepareCustodianUseCase;

  private constructor(data: PrepareCustodianUseCase) {
    this.data = data;
  }

}
