import type {
  AIInferenceConfig,
  AIService,
  Prompt,
  TextComponent,
} from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAIService implements AIService {
  async converse(_args: {
    prompt: Prompt;
    prefill?: TextComponent;
    inferenceConfig?: AIInferenceConfig;
  }): Promise<string> {
    return '';
  }
}

export const tokenFakeAIService = createInjectionToken<FakeAIService>(
  'FakeAIService',
  {
    useClass: FakeAIService,
  },
);
