import { z } from 'zod';

import { tokenComputeGraphDataUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

const ComputeGraphDataInputSchema = z.object({
  assessmentId: z.string().uuid(),
  organization: z.string().nonempty(),
});

export type ComputeGraphDataInput = z.infer<typeof ComputeGraphDataInputSchema>;

export type ComputeGraphDataOutput = void;

export class ComputeGraphDataAdapter {
  private readonly useCase = inject(tokenComputeGraphDataUseCase);

  public async handle(
    event: Record<string, unknown>
  ): Promise<ComputeGraphDataOutput> {
    const input = ComputeGraphDataInputSchema.parse(event);
    return await this.useCase.computeGraphData({
      assessmentId: input.assessmentId,
      organization: input.organization,
    });
  }
}
