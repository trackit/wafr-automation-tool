import {
  tokenCFNService,
  tokenLogger,
  tokenOrganizationRepository,
  tokenSTSService,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../useCases';

export type OnboardOrganizationUseCaseArgs = {
  organizationDomain: string;
  accountId: string;
};

export interface OnboardOrganizationUseCase {
  onboardOrganization(args: OnboardOrganizationUseCaseArgs): Promise<void>;
}

export class OnboardOrganizationUseCaseImpl
  implements OnboardOrganizationUseCase
{
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly stsService = inject(tokenSTSService);
  private readonly cfnService = inject(tokenCFNService);
  private readonly logger = inject(tokenLogger);

  public async onboardOrganization(
    args: OnboardOrganizationUseCaseArgs
  ): Promise<void> {
    const { organizationDomain, accountId } = args;
    const organization = await this.organizationRepository.get({
      organizationDomain,
    });
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    if (this.organizationRepository.isComplete({ organization })) {
      throw new NoContentError("Organization's onboarding is already complete");
    }
    await this.stsService
      .assumeRoleByAccountId({
        accountId,
        roleName: 'WAFR-Automation-Tool-ExecutionRole',
        sessionName: 'OnboardOrganizationSession',
      })
      .catch((error) => {
        this.logger.error(`Failed to assume role: ${error}`);
        throw error;
      });
    this.logger.info(
      `Successfully assumed role in account ${accountId} for organization ${organizationDomain}`
    );
    await this.cfnService.addStackSetAccount({
      accountId,
      regions: ['us-east-1'],
    });
    this.logger.info(
      `Successfully added account ${accountId} to CloudFormation StackSet`
    );
  }
}

export const tokenOnboardOrganizationUseCase =
  createInjectionToken<OnboardOrganizationUseCase>(
    'OnboardOrganizationUseCase',
    {
      useClass: OnboardOrganizationUseCaseImpl,
    }
  );
