export interface AIService {
  converse(args: { prompt: string }): Promise<string>;
}
