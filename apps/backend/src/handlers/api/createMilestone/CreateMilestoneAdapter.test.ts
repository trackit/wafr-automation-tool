import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenCreateMilestoneUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { CreateMilestoneAdapter } from './CreateMilestoneAdapter';
import { CreateMilestoneAdapterEventMother } from './CreateMilestoneAdapterEventMother';

describe('createMilestone adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = CreateMilestoneAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = CreateMilestoneAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
        })
      );
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = CreateMilestoneAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const region = 'us-west-2';
      const name = 'Milestone Name';
      const event = CreateMilestoneAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withRegion(region)
        .withName(name)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.createMilestone).toHaveBeenCalledWith({
        assessmentId,
        region,
        name,
        user,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { createMilestone: vitest.fn() };
  useCase.createMilestone.mockResolvedValueOnce(Promise.resolve());
  register(tokenCreateMilestoneUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new CreateMilestoneAdapter() };
};
