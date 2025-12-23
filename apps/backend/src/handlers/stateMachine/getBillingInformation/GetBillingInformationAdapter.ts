import z from 'zod';

import { tokenGetBillingInformationUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export const GetBillingInformationInputSchema = z.object({
  assessmentId: z.uuid(),
  organizationDomain: z.string().nonempty(),
});
export type GetBillingInformationInput = z.infer<
  typeof GetBillingInformationInputSchema
>;
export type GetBillingInformationOutput = void;

export class GetBillingInformationAdapter {
  private readonly useCase = inject(tokenGetBillingInformationUseCase);

  public async handle(
    event: Record<string, unknown>,
  ): Promise<GetBillingInformationOutput> {
    const { assessmentId, organizationDomain } =
      GetBillingInformationInputSchema.parse(event);
    await this.useCase.getBillingInformation({
      assessmentId,
      organizationDomain,
    });
  }
}
