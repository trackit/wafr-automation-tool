import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseStreamCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';

import type { AIService } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { PromptVariables } from '@backend/models';
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
      if (typeof text === 'string' && text.length) {
        result += text;
      }
    }
    return result;
  }

  public async converse(args: {
    promptArn: string;
    promptVariables: PromptVariables;
  }): Promise<string> {
    const command = new ConverseStreamCommand({
      modelId: args.promptArn,
      promptVariables: Object.entries(args.promptVariables).reduce(
        (promptVariables, [key, value]) => ({
          ...promptVariables,
          [key]: { text: JSON.stringify(value) },
        }),
        {}
      ),
    });
    try {
      const response = await this.client.send(command);
      if (response.$metadata.httpStatusCode !== 200 || !response.stream) {
        throw new Error(
          `Failed to converse: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info(`Converse#${args.promptArn}`, args.promptVariables);
      return await this.collectStreamedText(response);
    } catch (error) {
      this.logger.error(`Failed to converse: ${error}`, args.promptVariables);
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
