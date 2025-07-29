interface TextComponent {
  text: string;
}

interface CachePointComponent {
  cachePoint: boolean;
}

export type PromptComponent = TextComponent | CachePointComponent;
export type Prompt = PromptComponent[];

export interface AIService {
  converse(args: { prompt: Prompt }): Promise<string>;
}
