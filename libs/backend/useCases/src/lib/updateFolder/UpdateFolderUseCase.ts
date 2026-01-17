import {
  tokenAssessmentsRepository,
  tokenLogger,
  tokenOrganizationRepository,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

import { FolderAlreadyExistsError, FolderNotFoundError } from '../../errors';

export type UpdateFolderUseCaseArgs = {
  organizationDomain: string;
  oldFolderName: string;
  newFolderName: string;
};

export interface UpdateFolderUseCase {
  updateFolder(args: UpdateFolderUseCaseArgs): Promise<void>;
}

export class UpdateFolderUseCaseImpl implements UpdateFolderUseCase {
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateFolder(args: UpdateFolderUseCaseArgs): Promise<void> {
    const { organizationDomain, oldFolderName, newFolderName } = args;

    const organization =
      await this.organizationRepository.get(organizationDomain);
    const folders = organization?.folders ?? [];

    if (!folders.includes(oldFolderName)) {
      throw new FolderNotFoundError({
        folderName: oldFolderName,
        organizationDomain,
      });
    }

    if (folders.includes(newFolderName)) {
      throw new FolderAlreadyExistsError({
        folderName: newFolderName,
        organizationDomain,
      });
    }

    const updatedFolders = folders.map((f) =>
      f === oldFolderName ? newFolderName : f,
    );
    await this.organizationRepository.update({
      organizationDomain,
      organizationBody: { folders: updatedFolders },
    });

    await this.assessmentsRepository.updateAssessmentsByFolder({
      organizationDomain,
      oldFolderName,
      newFolderName,
    });

    this.logger.info(
      `Folder renamed from "${oldFolderName}" to "${newFolderName}" for organization ${organizationDomain}`,
    );
  }
}

export const tokenUpdateFolderUseCase =
  createInjectionToken<UpdateFolderUseCase>('UpdateFolderUseCase', {
    useClass: UpdateFolderUseCaseImpl,
  });
