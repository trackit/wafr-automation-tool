import { z } from 'zod';

import { ScanningTool } from '@backend/models';
import { tokenPrepareFindingsAssociationsUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

const PrepareFindingsAssociationsInputSchema = z.object({
  assessmentId: z.string().uuid(),
  scanningTool: z.nativeEnum(ScanningTool),
  regions: z.array(z.string().nonempty()),
  workflows: z.array(z.string().nonempty()),
  organizationDomain: z.string().nonempty(),
});

export type PrepareFindingsAssociationsInput = z.infer<
  typeof PrepareFindingsAssociationsInputSchema
>;
export type PrepareFindingsAssociationsOutput = string[];

export class PrepareFindingsAssociationsAdapter {
  private readonly useCase = inject(tokenPrepareFindingsAssociationsUseCase);

  public async handle(
    event: Record<string, unknown>
  ): Promise<PrepareFindingsAssociationsOutput> {
    const parsedInput = PrepareFindingsAssociationsInputSchema.parse(event);
    return this.useCase.prepareFindingsAssociations(parsedInput);
  }
}
