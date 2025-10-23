import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenGetOrganizationUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as getUserFromEventModule from '../../../utils/api/getUserFromEvent/getUserFromEvent';
import { GetOrganizationAdapter } from './GetOrganizationAdapter';
import { GetOrganizationAdapterEventMother } from './GetOrganizationAdapterEventMother';

describe('GetOrganizationAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetOrganizationAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call getUserFromEvent with the correct event', async () => {
      const { adapter, getUserSpy } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      await adapter.handle(event);
      expect(getUserSpy).toHaveBeenCalledWith(event);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with the user from the event', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const event = GetOrganizationAdapterEventMother.basic()
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.getOrganizationDetails).toHaveBeenCalledWith({
        organizationDomain: user.organizationDomain,
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GetOrganizationAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const getUserSpy = vitest.spyOn(getUserFromEventModule, 'getUserFromEvent');

  const useCase = {
    getOrganizationDetails: vi.fn(),
  };
  useCase.getOrganizationDetails.mockResolvedValue({
    currentYearTotalAssessments: 0,
    ACEOpportunitiesPerMonth: {},
  });

  register(tokenGetOrganizationUseCase, { useValue: useCase });

  return { getUserSpy, useCase, adapter: new GetOrganizationAdapter() };
};
