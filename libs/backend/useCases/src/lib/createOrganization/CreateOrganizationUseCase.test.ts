import {
  registerTestInfrastructure,
  tokenFakeOrganizationRepository,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { CreateOrganizationUseCaseImpl } from './CreateOrganizationUseCase';

beforeAll(async () => {
  reset();
  registerTestInfrastructure();
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
});

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
  await clientManager.closeConnections();
});

describe('CreateOrganizationUseCase', () => {
  it('should create a database', async () => {
    const { useCase, clientManager } = setup();
    const org = OrganizationMother.basic()
      .withDomain('organization1')
      .build();
    const createClientSpy = vitest.spyOn(clientManager, 'createClient');
    await useCase.createOrganization(org);
    expect(createClientSpy).toHaveBeenCalledWith('organization1');
  });

  it('should save the organization into the repository', async () => {
    const { useCase, fakeOrganizationRepository } = setup();
    const org = OrganizationMother.basic()
      .withDomain('organization1')
      .build();
    await useCase.createOrganization(org);
    expect(fakeOrganizationRepository.organizations.organization1).toEqual(org);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new CreateOrganizationUseCaseImpl(),
    clientManager: inject(tokenTypeORMClientManager),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
  };
};
