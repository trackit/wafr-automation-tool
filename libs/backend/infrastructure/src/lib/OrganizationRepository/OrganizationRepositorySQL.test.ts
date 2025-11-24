import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { startPostgresContainer } from '../infrastructure';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import { OrganizationRepositorySQL } from './OrganizationRepositorySQL';

let pgContainer: Awaited<ReturnType<typeof startPostgresContainer>>;

beforeAll(async () => {
  reset();
  pgContainer = await startPostgresContainer();
  registerTestInfrastructure();

  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
});

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
  await clientManager.closeConnections();
});

afterAll(async () => {
  await pgContainer.stop();
});

describe('OrganizationRepositorySQL', () => {
  describe('save', () => {
    it('should save an organization to SQL', async () => {
      const { repository } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('organization1')
        .withAssessmentExportRoleArn(
          'arn:aws:iam::123456789012:role/ExportRole',
        )
        .withAceIntegration({
          roleArn: 'arn:aws:iam::123456789012:role/testRole',
          opportunityTeamMembers: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'johndoe@test.io',
            },
          ],
          solutions: ['solution1', 'solution2'],
        })
        .build();
      await repository.save(organization);

      const savedOrganization = await repository.get(organization.domain);
      expect(savedOrganization).toEqual(organization);
    });

    it('should create the organization database', async () => {
      const { repository, clientManager } = setup();
      const createClientSpy = vitest.spyOn(clientManager, 'createClient');

      const organization = OrganizationMother.basic()
        .withDomain('organization1')
        .build();
      await repository.save(organization);
      expect(createClientSpy).toHaveBeenCalledWith('organization1');
    });
  });

  describe('get', () => {
    it('should get an organization by domain', async () => {
      const { repository } = setup();

      const organization = OrganizationMother.basic()
        .withDomain('organization1')
        .withAssessmentExportRoleArn(
          'arn:aws:iam::123456789012:role/ExportRole',
        )
        .withAceIntegration({
          roleArn: 'arn:aws:iam::123456789012:role/testRole',
          opportunityTeamMembers: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'johndoe@test.io',
            },
          ],
          solutions: ['solution1', 'solution2'],
        })
        .build();
      await repository.save(organization);

      const fetchedOrganization = await repository.get('organization1');
      expect(fetchedOrganization).toEqual(organization);
    });

    it('should return undefined if organization does not exist', async () => {
      const { repository } = setup();

      const fetchedOrganization = await repository.get('organization1');
      expect(fetchedOrganization).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should get all organizations', async () => {
      const { repository } = setup();

      const organization1 = OrganizationMother.basic()
        .withDomain('organization1')
        .build();
      const organization2 = OrganizationMother.basic()
        .withDomain('organization2')
        .build();

      await Promise.all([
        repository.save(organization1),
        repository.save(organization2),
      ]);

      const organizations = await repository.getAll();
      expect(organizations).toEqual([organization1, organization2]);
    });

    it('should get organizations with offset', async () => {
      const { repository } = setup();

      const organization1 = OrganizationMother.basic()
        .withDomain('organization1')
        .build();
      const organization2 = OrganizationMother.basic()
        .withDomain('organization2')
        .build();
      const organization3 = OrganizationMother.basic()
        .withDomain('organization3')
        .build();

      await Promise.all([
        repository.save(organization1),
        repository.save(organization2),
        repository.save(organization3),
      ]);

      const organizations = await repository.getAll({ offset: 1 });
      expect(organizations).toEqual([organization2, organization3]);
    });

    it('should get organizations with limit', async () => {
      const { repository } = setup();

      const organization1 = OrganizationMother.basic()
        .withDomain('organization1')
        .build();
      const organization2 = OrganizationMother.basic()
        .withDomain('organization2')
        .build();
      const organization3 = OrganizationMother.basic()
        .withDomain('organization3')
        .build();

      await Promise.all([
        repository.save(organization1),
        repository.save(organization2),
        repository.save(organization3),
      ]);

      const organizations = await repository.getAll({ limit: 2 });
      expect(organizations).toEqual([organization1, organization2]);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    repository: new OrganizationRepositorySQL(),
    clientManager: inject(tokenTypeORMClientManager),
  };
};
