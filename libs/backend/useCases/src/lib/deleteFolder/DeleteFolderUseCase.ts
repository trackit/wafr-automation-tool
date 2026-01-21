import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

import { FolderNotFoundError } from '../../errors';

export type DeleteFolderUseCaseArgs = {
  organizationDomain: string;
  folderName: string;
};

export interface DeleteFolderUseCase {
  deleteFolder(args: DeleteFolderUseCaseArgs): Promise<void>;
}

export class DeleteFolderUseCaseImpl implements DeleteFolderUseCase {
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async deleteFolder(args: DeleteFolderUseCaseArgs): Promise<void> {
    const { organizationDomain, folderName } = args;

    const organization =
      await this.organizationRepository.get(organizationDomain);
    const folders = organization?.folders ?? [];

    if (!folders.includes(folderName)) {
      throw new FolderNotFoundError({ folderName, organizationDomain });
    }

    const updatedFolders = folders.filter((f) => f !== folderName);
    await this.organizationRepository.update({
      organizationDomain,
      organizationBody: { folders: updatedFolders },
    });

    await this.assessmentsRepository.clearAssessmentsFolder({
      organizationDomain,
      folderName,
    });

    this.logger.info(
      `Folder "${folderName}" deleted for organization ${organizationDomain}`,
    );
  }
}

export const tokenDeleteFolderUseCase =
  createInjectionToken<DeleteFolderUseCase>('DeleteFolderUseCase', {
    useClass: DeleteFolderUseCaseImpl,
  });
