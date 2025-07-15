export interface AIService {
  converse(args: {
    promptArn: string;
    promptVariables: Record<string, unknown>;
  }): Promise<string>;
}
