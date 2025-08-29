import { InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime';

import type { AIService, Prompt, TextComponent } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAIService implements AIService {
  async converse(args: {
    prompt: Prompt;
    prefill?: TextComponent;
    inferenceConfig?: InferenceConfiguration;
  }): Promise<string> {
    // No-op for fake implementation
    return '';
  }
}

export const tokenFakeAIService = createInjectionToken<FakeAIService>(
  'FakeAIService',
  {
    useClass: FakeAIService,
  }
);
