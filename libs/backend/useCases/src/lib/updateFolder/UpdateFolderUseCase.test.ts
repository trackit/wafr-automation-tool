import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { AssessmentMother, OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { FolderAlreadyExistsError, FolderNotFoundError } from '../../errors';
import { UpdateFolderUseCaseImpl } from './UpdateFolderUseCase';

describe('UpdateFolderUseCase', () => {
  it('should rename a folder in the organization', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Old Folder', 'Other Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await useCase.updateFolder({
      organizationDomain: organization.domain,
      oldFolderName: 'Old Folder',
      newFolderName: 'New Folder',
    });

    const updatedOrganization = await fakeOrganizationRepository.get(
      organization.domain,
    );
    expect(updatedOrganization?.folders).toEqual([
      'New Folder',
      'Other Folder',
    ]);
  });

  it('should update assessments with the old folder name', async () => {
    const { useCase, fakeOrganizationRepository, fakeAssessmentsRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Old Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withFolder('Old Folder')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    await useCase.updateFolder({
      organizationDomain: organization.domain,
      oldFolderName: 'Old Folder',
      newFolderName: 'New Folder',
    });

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: organization.domain,
    });
    expect(updatedAssessment?.folder).toBe('New Folder');
  });

  it('should throw FolderNotFoundError if folder does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Existing Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await expect(
      useCase.updateFolder({
        organizationDomain: organization.domain,
        oldFolderName: 'Non Existent Folder',
        newFolderName: 'New Folder',
      }),
    ).rejects.toThrow(FolderNotFoundError);
  });

  it('should throw FolderAlreadyExistsError if new folder name already exists', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Folder A', 'Folder B'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await expect(
      useCase.updateFolder({
        organizationDomain: organization.domain,
        oldFolderName: 'Folder A',
        newFolderName: 'Folder B',
      }),
    ).rejects.toThrow(FolderAlreadyExistsError);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new UpdateFolderUseCaseImpl(),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
