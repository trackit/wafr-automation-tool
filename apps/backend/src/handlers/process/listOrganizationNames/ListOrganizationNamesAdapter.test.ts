import {
  registerTestInfrastructure,
  tokenFakeOrganizationRepository,
} from '@backend/infrastructure';
import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { ListOrganizationNamesAdapter } from './ListOrganizationNamesAdapter';

describe('ListOrganizationNamesAdapter', () => {
  it('should return organizations as payload', async () => {
    const { fakeOrganizationRepository, adapter } = setup();

    const organization1 = OrganizationMother.basic()
      .withDomain('organization1')
      .build();
    const organization2 = OrganizationMother.basic()
      .withDomain('organization2')
      .build();
    await Promise.all([
      fakeOrganizationRepository.save(organization1),
      fakeOrganizationRepository.save(organization2),
    ]);

    const res = await adapter.handle();
    expect(res).toEqual(
      expect.arrayContaining([organization1.name, organization2.name]),
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const adapter = new ListOrganizationNamesAdapter();
  return {
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    adapter,
  };
};
