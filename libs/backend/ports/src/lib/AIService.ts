import { PromptVariables } from '@backend/models';

export interface AIService {
  converse(args: {
    promptArn: string;
    promptVariables: PromptVariables;
  }): Promise<string>;
}
