import { z } from 'zod';

import { tokenCleanupUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export const CleanupInput = z.object({
  assessmentId: z.string(),
  organization: z.string(),
  error: z
    .object({
      Cause: z.string(),
      Error: z.string(),
    })
    .optional(),
});

export type CleanupOutput = void;

export class CleanupAdapter {
  private readonly useCase = inject(tokenCleanupUseCase);

  public async handle(
    event: z.infer<typeof CleanupInput>
  ): Promise<CleanupOutput> {
    const parsedEvent = CleanupInput.parse(event);
    await this.useCase.execute(parsedEvent);
  }
}
