import {
  BedrockRuntimeClient,
  CachePointType,
  ConversationRole,
  ConverseStreamCommand,
  type ConverseStreamCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';

import type {
  AIInferenceConfig,
  AIService,
  Prompt,
  TextComponent,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';

export class AIServiceBedrock implements AIService {
  private readonly client = inject(tokenClientBedrockRuntime);
  private readonly logger = inject(tokenLogger);

  public async collectStreamedText(
    response: ConverseStreamCommandOutput,
  ): Promise<string> {
    let result = '';
    if (!response.stream) {
      throw new Error(
        `Failed to converse: ${response.$metadata.httpStatusCode}`,
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

  public async converse(args: {
    prompt: Prompt;
    inferenceConfig?: AIInferenceConfig;
    prefill?: TextComponent;
  }): Promise<string> {
    const { prompt, prefill, inferenceConfig } = args;

    const command = new ConverseStreamCommand({
      modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      messages: [
        {
          role: ConversationRole.USER,
          content: prompt.map((component) => {
            if ('text' in component) {
              return { text: component.text };
            } else if ('cachePoint' in component) {
              return { cachePoint: { type: CachePointType.DEFAULT } };
            }
            throw new Error('Invalid prompt component type');
          }),
        },
        ...(prefill
          ? [{ role: ConversationRole.ASSISTANT, content: [prefill] }]
          : []),
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0,
        ...inferenceConfig,
      },
    });

    const response = await this.client.send(command);

    if (response.$metadata.httpStatusCode !== 200 || !response.stream) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info('Converse', { prompt });
    this.logger.debug('Converse Response', { response });
    return await this.collectStreamedText(response);
  }
}

export const tokenAIService = createInjectionToken<AIService>('AIService', {
  useClass: AIServiceBedrock,
});

export const tokenClientBedrockRuntime =
  createInjectionToken<BedrockRuntimeClient>('ClientBedrockRuntime', {
    useClass: BedrockRuntimeClient,
  });
