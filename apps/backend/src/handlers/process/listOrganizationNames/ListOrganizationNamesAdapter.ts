import { tokenOrganizationRepository } from '@backend/infrastructure';
import { inject } from '@shared/di-container';

export class ListOrganizationNamesAdapter {
  private readonly organizationRepository = inject(tokenOrganizationRepository);

  public async handle(): Promise<string[]> {
    const organizations = await this.organizationRepository.getAll();
    return organizations.map((org) => org.name);
  }
}
