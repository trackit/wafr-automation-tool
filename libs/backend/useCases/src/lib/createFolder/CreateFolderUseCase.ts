import {
  tokenLogger,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

import { FolderAlreadyExistsError } from '../../errors';

export type CreateFolderUseCaseArgs = {
  organizationDomain: string;
  folderName: string;
};

export interface CreateFolderUseCase {
  createFolder(args: CreateFolderUseCaseArgs): Promise<void>;
}

export class CreateFolderUseCaseImpl implements CreateFolderUseCase {
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly logger = inject(tokenLogger);

  public async createFolder(args: CreateFolderUseCaseArgs): Promise<void> {
    const { organizationDomain, folderName } = args;

    const organization =
      await this.organizationRepository.get(organizationDomain);
    const folders = organization?.folders ?? [];

    if (folders.includes(folderName)) {
      throw new FolderAlreadyExistsError({ folderName, organizationDomain });
    }

    await this.organizationRepository.update({
      organizationDomain,
      organizationBody: { folders: [...folders, folderName] },
    });

    this.logger.info(
      `Folder "${folderName}" created for organization ${organizationDomain}`,
    );
  }
}

export const tokenCreateFolderUseCase =
  createInjectionToken<CreateFolderUseCase>('CreateFolderUseCase', {
    useClass: CreateFolderUseCaseImpl,
  });
