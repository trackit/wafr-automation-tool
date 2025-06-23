import { z } from 'zod';

import { tokenPreparePromptsUseCase } from '@backend/useCases';
import { ScanningTool } from '@backend/models';
import { inject } from '@shared/di-container';

const PreparePromptsInputSchema = z.object({
  assessmentId: z.string().uuid(),
  scanningTool: z.nativeEnum(ScanningTool),
  regions: z.array(z.string()),
  workflows: z.array(z.string()),
  organization: z.string(),
});

export type PreparePromptsInput = z.infer<typeof PreparePromptsInputSchema>;
export type PreparePromptsOutput = string[];

export class PreparePromptsAdapter {
  private readonly useCase = inject(tokenPreparePromptsUseCase);

  public async handle(
    event: Record<string, unknown>
  ): Promise<PreparePromptsOutput> {
    const parsedInput = PreparePromptsInputSchema.parse(event);
    return this.useCase.preparePrompts(parsedInput);
  }
}
