import { PromptVariables } from '@backend/models';
import type { AIService } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAIService implements AIService {
  converse(args: {
    promptArn: string;
    promptVariables: PromptVariables;
  }): Promise<string> {
    // No-op for fake implementation
    return Promise.resolve('');
  }
}

export const tokenFakeAIService = createInjectionToken<FakeAIService>(
  'FakeAIService',
  {
    useClass: FakeAIService,
  }
);
