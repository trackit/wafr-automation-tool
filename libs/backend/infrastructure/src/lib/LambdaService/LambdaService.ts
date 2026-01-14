import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

import { type LambdaServicePort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

export class LambdaService implements LambdaServicePort {
  private readonly lambdaClient = inject(tokenLambdaClient);

  public async asyncInvokeLambda({
    lambdaArn,
    payload,
  }: {
    lambdaArn: string;
    payload?: string;
  }): Promise<void> {
    await this.lambdaClient.send(
      new InvokeCommand({
        FunctionName: lambdaArn,
        Payload: payload,
        InvocationType: 'Event',
      }),
    );
  }
}

export const tokenLambdaClient = createInjectionToken<LambdaClient>(
  'LambdaClient',
  {
    useClass: LambdaClient,
  },
);

export const tokenLambdaService = createInjectionToken<LambdaServicePort>(
  'LambdaService',
  {
    useClass: LambdaService,
  },
);
