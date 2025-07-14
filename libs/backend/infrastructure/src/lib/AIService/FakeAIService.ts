import type { AIService } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAIService implements AIService {
  async converse(args: {
    promptArn: string;
    promptVariables: Record<string, unknown>;
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
