import {
  registerTestInfrastructure,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { FolderAlreadyExistsError } from '../../errors';
import { CreateFolderUseCaseImpl } from './CreateFolderUseCase';

describe('CreateFolderUseCase', () => {
  it('should create a folder in an organization with no existing folders', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic().build();
    await fakeOrganizationRepository.save(organization);

    await useCase.createFolder({
      organizationDomain: organization.domain,
      folderName: 'New Folder',
    });

    const updatedOrganization = await fakeOrganizationRepository.get(
      organization.domain,
    );
    expect(updatedOrganization?.folders).toEqual(['New Folder']);
  });

  it('should add a folder to existing folders', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Existing Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await useCase.createFolder({
      organizationDomain: organization.domain,
      folderName: 'New Folder',
    });

    const updatedOrganization = await fakeOrganizationRepository.get(
      organization.domain,
    );
    expect(updatedOrganization?.folders).toEqual([
      'Existing Folder',
      'New Folder',
    ]);
  });

  it('should throw FolderAlreadyExistsError if folder name already exists', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Existing Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await expect(
      useCase.createFolder({
        organizationDomain: organization.domain,
        folderName: 'Existing Folder',
      }),
    ).rejects.toThrow(FolderAlreadyExistsError);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new CreateFolderUseCaseImpl(),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
