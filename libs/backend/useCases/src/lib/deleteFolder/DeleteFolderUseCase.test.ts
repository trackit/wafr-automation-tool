import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { AssessmentMother, OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { FolderNotFoundError } from '../../errors';
import { DeleteFolderUseCaseImpl } from './DeleteFolderUseCase';

describe('DeleteFolderUseCase', () => {
  it('should delete a folder from the organization', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Folder To Delete', 'Other Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await useCase.deleteFolder({
      organizationDomain: organization.domain,
      folderName: 'Folder To Delete',
    });

    const updatedOrganization = await fakeOrganizationRepository.get(
      organization.domain,
    );
    expect(updatedOrganization?.folders).toEqual(['Other Folder']);
  });

  it('should clear folder from assessments that had the deleted folder', async () => {
    const { useCase, fakeOrganizationRepository, fakeAssessmentsRepository } =
      setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Folder To Delete'])
      .build();
    await fakeOrganizationRepository.save(organization);

    const assessment = AssessmentMother.basic()
      .withOrganization(organization.domain)
      .withFolder('Folder To Delete')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    await useCase.deleteFolder({
      organizationDomain: organization.domain,
      folderName: 'Folder To Delete',
    });

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: organization.domain,
    });
    expect(updatedAssessment?.folder).toBeUndefined();
  });

  it('should throw FolderNotFoundError if folder does not exist', async () => {
    const { useCase, fakeOrganizationRepository } = setup();

    const organization = OrganizationMother.basic()
      .withFolders(['Existing Folder'])
      .build();
    await fakeOrganizationRepository.save(organization);

    await expect(
      useCase.deleteFolder({
        organizationDomain: organization.domain,
        folderName: 'Non Existent Folder',
      }),
    ).rejects.toThrow(FolderNotFoundError);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new DeleteFolderUseCaseImpl(),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
