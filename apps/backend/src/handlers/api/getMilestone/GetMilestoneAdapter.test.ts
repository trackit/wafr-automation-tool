import { registerTestInfrastructure } from '@backend/infrastructure';
import { MilestoneMother, UserMother } from '@backend/models';
import { tokenGetMilestoneUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { GetMilestoneAdapter } from './GetMilestoneAdapter';
import { GetMilestoneAdapterEventMother } from './GetMilestoneAdapterEventMother';

describe('getMilestone adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetMilestoneAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = GetMilestoneAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          querySchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = GetMilestoneAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid milestoneId', async () => {
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
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const milestoneId = 2;
      const region = 'eu-west-1';
      const event = GetMilestoneAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withMilestoneId(milestoneId)
        .withRegion(region)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.getMilestone).toHaveBeenCalledWith({
        organizationDomain: 'test.io',
        assessmentId,
        milestoneId,
        region,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { getMilestone: vitest.fn() };
  useCase.getMilestone.mockResolvedValueOnce(
    Promise.resolve(MilestoneMother.basic().build()),
  );
  register(tokenGetMilestoneUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new GetMilestoneAdapter() };
};
