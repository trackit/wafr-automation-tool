import {
  tokenLogger,
  tokenOrganizationRepository,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { Organization } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

export interface CreateOrganizationUseCase {
  createOrganization(params: Organization): Promise<void>;
}

export class CreateOrganizationUseCaseImpl
  implements CreateOrganizationUseCase
{
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  public async createOrganization(organization: Organization): Promise<void> {
    await Promise.all([
      this.createDatabase(organization.domain),
      this.saveOrganization(organization),
    ]);
  }

  private async createDatabase(domain: string): Promise<void> {
    await this.clientManager.initialize();
    await this.clientManager.createClient(domain);
    this.logger.info(`Database created for organization: ${domain}`);
  }

  private async saveOrganization(organization: Organization): Promise<void> {
    await this.organizationRepository.save(organization);
    this.logger.info(
      `Organization successfully created: ${organization.domain}`,
    );
  }
}

export const tokenCreateOrganizationUseCase =
  createInjectionToken<CreateOrganizationUseCase>('CreateOrganizationUseCase', {
    useClass: CreateOrganizationUseCaseImpl,
  });
