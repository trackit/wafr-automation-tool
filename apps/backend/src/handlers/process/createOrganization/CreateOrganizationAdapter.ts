import z from 'zod';

import {
  tokenLogger,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { Organization } from '@backend/models';
import { inject } from '@shared/di-container';

const OrganizationSchema = z.object({
  domain: z.string(),
  name: z.string(),
  accountId: z.string().optional(),
  assessmentExportRoleArn: z.string().optional(),
  unitBasedAgreementId: z.string().optional(),
  freeAssessmentsLeft: z.number().optional(),
  aceIntegration: z
    .object({
      roleArn: z.string(),
      opportunityTeamMembers: z.array(
        z.object({
          email: z.string(),
          firstName: z.string(),
          lastName: z.string(),
        }),
      ),
      solutions: z.array(z.string()),
    })
    .optional(),
}) satisfies z.ZodType<Organization>;

export class CreateOrganizationAdapter {
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly logger = inject(tokenLogger);

  public async handle(organization: Organization): Promise<void> {
    OrganizationSchema.parse(organization);
    await this.organizationRepository.save(organization);
    this.logger.info(`Organization ${organization.domain} created.`);
  }
}
