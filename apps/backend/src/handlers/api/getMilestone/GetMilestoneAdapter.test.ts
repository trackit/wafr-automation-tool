import { registerTestInfrastructure } from '@backend/infrastructure';
import { MilestoneMother } from '@backend/models';
import { tokenGetMilestoneUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetMilestoneAdapter } from './GetMilestoneAdapter';
import { GetMilestoneAdapterEventMother } from './GetMilestoneAdapterEventMother';

describe('GetMilestoneAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetMilestoneAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = GetMilestoneAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid milestoneId', async () => {
      const { adapter } = setup();

      const event = GetMilestoneAdapterEventMother.basic()
        .withMilestoneId('invalid-number')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should pass without query parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withQueryStringParameters({})
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          milestoneId: '1',
        })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('useCase and return value', () => {
    it('should call the use case with correct parameters', async () => {
      const { adapter, useCase } = setup();

      const event = GetMilestoneAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withMilestoneId(2)
        .withRegion('eu-west-1')
        .withUser({
          id: 'user-id',
          email: 'user-id@test.io',
        })
        .build();

      await adapter.handle(event);

      expect(useCase.getMilestone).toHaveBeenCalledWith({
        organizationDomain: 'test.io',
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        milestoneId: 2,
        region: 'eu-west-1',
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GetMilestoneAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getMilestone: vitest.fn() };
  useCase.getMilestone.mockResolvedValueOnce(
    Promise.resolve(MilestoneMother.basic().build())
  );
  register(tokenGetMilestoneUseCase, { useValue: useCase });
  const adapter = new GetMilestoneAdapter();
  return { adapter, useCase };
};
