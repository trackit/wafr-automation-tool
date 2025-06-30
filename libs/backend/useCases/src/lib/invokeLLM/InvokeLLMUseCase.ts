import {
  tokenAIService,
  tokenLogger,
  tokenObjectsStorage,
} from '@backend/infrastructure';
import {
  AIFindingAssociationListSchema,
  PromptVariables,
} from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { parseJsonArray } from '@shared/utils';
import { tokenStoreResultsUseCase } from '../storeResults';

export type InvokeLLMUseCaseArgs = {
  assessmentId: string;
  organization: string;
  promptArn: string;
  promptUri: string;
};

export interface InvokeLLMUseCase {
  invokeLLM(args: InvokeLLMUseCaseArgs): Promise<void>;
}

export class InvokeLLMUseCaseImpl implements InvokeLLMUseCase {
  private readonly storeResultsUseCase = inject(tokenStoreResultsUseCase);
  private readonly objectsStorage = inject(tokenObjectsStorage);
  private readonly aiService = inject(tokenAIService);
  private readonly logger = inject(tokenLogger);

  public async retrievePromptVariables(
    promptUri: string
  ): Promise<PromptVariables> {
    const { key } = this.objectsStorage.parseURI(promptUri);
    const promptVariables = await this.objectsStorage.get(key);
    if (!promptVariables) {
      throw new Error(`Prompt variables not found for URI: ${promptUri}`);
    }
    const parsedPromptVariables = parseJsonArray(
      promptVariables
    ) as unknown as PromptVariables;
    return parsedPromptVariables;
  }

  public async invokeLLM(args: InvokeLLMUseCaseArgs): Promise<void> {
    const promptVariables = await this.retrievePromptVariables(args.promptUri);
    this.logger.info(`InvokeLLM#${args.promptArn}`, promptVariables);
    const response = await this.aiService.converse({
      promptArn: args.promptArn,
      promptVariables: promptVariables as unknown as Record<string, unknown>,
    });
    const parsedResponse = AIFindingAssociationListSchema.parse(
      parseJsonArray(response)
    );
    this.logger.info(`Converse#${args.promptArn} response`, response);
    await this.storeResultsUseCase.storeResults({
      assessmentId: args.assessmentId,
      organization: args.organization,
      promptUri: args.promptUri,
      aiFindingAssociations: parsedResponse,
    });
  }
}

export const tokenInvokeLLMUseCase = createInjectionToken<InvokeLLMUseCase>(
  'InvokeLLMUseCase',
  {
    useClass: InvokeLLMUseCaseImpl,
  }
);
