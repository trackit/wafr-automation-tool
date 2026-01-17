import { type InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime';

export interface TextComponent {
  text: string;
}

export interface CachePointComponent {
  cachePoint: boolean;
}

export type PromptComponent = TextComponent | CachePointComponent;
export type Prompt = PromptComponent[];

export interface AIService {
  converse(args: {
    prompt: Prompt;
    inferenceConfig?: InferenceConfiguration;
    prefill?: TextComponent;
  }): Promise<string>;
}
