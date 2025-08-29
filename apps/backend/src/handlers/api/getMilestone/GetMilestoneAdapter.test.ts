import { registerTestInfrastructure } from '@backend/infrastructure';
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

      expect(response.statusCode).toBe(200);
    });

    it('should return a 400 without path parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters(null)
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: 'invalid-uuid',
          milestoneId: '1',
        })
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid milestoneId', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          milestoneId: 'invalid-number',
        })
        .withBody(JSON.stringify({ region: 'us-west-2' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('getMilestone', () => {
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
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getMilestone: vitest.fn() };
  useCase.getMilestone.mockResolvedValueOnce(
    Promise.resolve({
      id: 1,
      name: 'Milestone 1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      pillars: [],
    })
  );
  register(tokenGetMilestoneUseCase, { useValue: useCase });
  const adapter = new GetMilestoneAdapter();
  return { adapter, useCase };
};
