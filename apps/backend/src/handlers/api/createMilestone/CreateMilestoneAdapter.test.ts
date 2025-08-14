import { register, reset } from '@shared/di-container';
import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenCreateMilestoneUseCase } from '@backend/useCases';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { CreateMilestoneAdapter } from './CreateMilestoneAdapter';
import { CreateMilestoneAdapterEventMother } from './CreateMilestoneAdapterEventMother';

describe('CreateMilestone adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = CreateMilestoneAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid json body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().withBody('{').build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withBody(JSON.stringify({ invalid: 'body' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const event = CreateMilestoneAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withRegion('us-west-2')
        .withName('Milestone Name')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.createMilestone).toHaveBeenCalledWith({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        region: 'us-west-2',
        name: 'Milestone Name',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = CreateMilestoneAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { createMilestone: vitest.fn() };
  useCase.createMilestone.mockResolvedValueOnce(Promise.resolve());
  register(tokenCreateMilestoneUseCase, { useValue: useCase });
  const adapter = new CreateMilestoneAdapter();
  return { useCase, adapter };
};
