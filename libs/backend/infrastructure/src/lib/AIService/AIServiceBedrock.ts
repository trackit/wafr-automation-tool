import {
  BedrockRuntimeClient,
  CachePointType,
  ConverseStreamCommand,
  ConverseStreamCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';

import type { AIService, PromptComponent } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';

export class AIServiceBedrock implements AIService {
  private readonly client = inject(tokenClientBedrockRuntime);
  private readonly logger = inject(tokenLogger);

  public async collectStreamedText(
    response: ConverseStreamCommandOutput
  ): Promise<string> {
    let result = '';
    if (!response.stream) {
      throw new Error(
        `Failed to converse: ${response.$metadata.httpStatusCode}`
      );
    }
    for await (const item of response.stream) {
      const text = item.contentBlockDelta?.delta?.text;
      if (text && text.length > 0) {
        result += text;
      }
    }
    return result;
  }

  public async converse(args: { prompt: PromptComponent[] }): Promise<string> {
    const { prompt } = args;

    const command = new ConverseStreamCommand({
      modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      messages: [
        {
          role: 'user',
          content: prompt.map((component) => {
            if ('text' in component) {
              return { text: component.text };
            } else if ('cachePoint' in component) {
              return { cachePoint: { type: CachePointType.DEFAULT } };
            }
            throw new Error('Invalid prompt component type');
          }),
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0,
      },
    });
    try {
      const response = await this.client.send(command);

      if (response.$metadata.httpStatusCode !== 200 || !response.stream) {
        throw new Error(
          `Failed to converse: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info('Converse', { prompt });
      return await this.collectStreamedText(response);
    } catch (error) {
      this.logger.error(`Failed to converse: ${error}`, { prompt });
      throw error;
    }
  }
}

export const tokenAIService = createInjectionToken<AIService>('AIService', {
  useClass: AIServiceBedrock,
});

export const tokenClientBedrockRuntime =
  createInjectionToken<BedrockRuntimeClient>('ClientBedrockRuntime', {
    useClass: BedrockRuntimeClient,
  });
