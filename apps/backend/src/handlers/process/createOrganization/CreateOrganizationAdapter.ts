import z from 'zod';

import { Organization } from '@backend/models';
import { tokenCreateOrganizationUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

const OrganizationSchema = z.object({
  domain: z.string(),
  name: z.string(),
  accountId: z.string().optional(),
  assessmentExportRoleArn: z.string().optional(),
  unitBasedAgreementId: z.string().optional(),
  freeAssessmentsLeft: z.number().optional(),
}) satisfies z.ZodType<Organization>;

export class CreateOrganizationAdapter {
  private readonly useCase = inject(tokenCreateOrganizationUseCase);

  public async handle(params: Organization): Promise<void> {
    OrganizationSchema.parse(params);
    await this.useCase.createOrganization(params);
  }
}
