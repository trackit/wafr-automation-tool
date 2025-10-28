import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenStartAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { StartAssessmentAdapter } from './StartAssessmentAdapter';
import { StartAssessmentAdapterEventMother } from './StartAssessmentAdapterEventMother';

describe('startAssessment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = StartAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = StartAssessmentAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          bodySchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const name = 'Test Assessment';
      const regions = ['us-west-1', 'us-west-2'];
      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const workflows = ['workflow-1', 'workflow-2'];
      const event = StartAssessmentAdapterEventMother.basic()
        .withName(name)
        .withRegions(regions)
        .withRoleArn(roleArn)
        .withWorkflows(workflows)
        .build();

      await adapter.handle(event);

      expect(useCase.startAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          name,
          regions,
          roleArn,
          workflows,
        }),
      );
    });

    it('should return a 201 status code', async () => {
      const { adapter } = setup();

      const event = StartAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(201);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { startAssessment: vitest.fn() };
  useCase.startAssessment.mockResolvedValueOnce({
    assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
  });
  register(tokenStartAssessmentUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new StartAssessmentAdapter() };
};
