import { type LambdaServicePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

class FakeLambdaService implements LambdaServicePort {
  public async asyncInvokeLambda(_args: {
    lambdaArn: string;
    payload: string;
  }): Promise<void> {
    // No-op for fake implementation
  }
}

export const tokenFakeLambdaService = createInjectionToken(
  'FakeLambdaService',
  {
    useClass: FakeLambdaService,
  },
);
