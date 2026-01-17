export interface TextComponent {
  text: string;
}

export interface CachePointComponent {
  cachePoint: boolean;
}

export type PromptComponent = TextComponent | CachePointComponent;
export type Prompt = PromptComponent[];

export interface AIInferenceConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface AIService {
  converse(args: {
    prompt: Prompt;
    inferenceConfig?: AIInferenceConfig;
    prefill?: TextComponent;
  }): Promise<string>;
}
