import { z } from 'zod';

import { tokenInvokeLLMUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export const InvokeLLMInputSchema = z.object({
  assessmentId: z.string(),
  organization: z.string(),
  promptArn: z.string(),
  promptUri: z.string(),
});

export type InvokeLLMInput = z.infer<typeof InvokeLLMInputSchema>;
export type InvokeLLMOutput = void;

export class InvokeLLMAdapter {
  private readonly invokeLLMUseCase = inject(tokenInvokeLLMUseCase);

  public async handle(
    event: Record<string, unknown>
  ): Promise<InvokeLLMOutput> {
    const { assessmentId, organization, promptArn, promptUri } =
      InvokeLLMInputSchema.parse(event);
    await this.invokeLLMUseCase.invokeLLM({
      assessmentId,
      organization,
      promptArn,
      promptUri,
    });
  }
}
