import { z } from 'zod';

import { tokenCleanupUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export const CleanupInputSchema = z.object({
  assessmentId: z.string(),
  organization: z.string(),
  error: z
    .object({
      Cause: z.string(),
      Error: z.string(),
    })
    .optional(),
});

export type CleanupInput = z.infer<typeof CleanupInputSchema>;
export type CleanupOutput = void;

export class CleanupAdapter {
  private readonly useCase = inject(tokenCleanupUseCase);

  public async handle(event: Record<string, unknown>): Promise<CleanupOutput> {
    const parsedEvent = CleanupInputSchema.parse(event);
    await this.useCase.cleanup(parsedEvent);
  }
}
