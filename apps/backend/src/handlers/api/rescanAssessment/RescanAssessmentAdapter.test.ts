import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenRescanAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { RescanAssessmentAdapter } from './RescanAssessmentAdapter';
import { RescanAssessmentAdapterEventMother } from './RescanAssessmentAdapterEventMother';

describe('rescanAssessment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = RescanAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = RescanAssessmentAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
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

      const event = RescanAssessmentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const event = RescanAssessmentAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .build();

      await adapter.handle(event);
      expect(useCase.rescanAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
        }),
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = RescanAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { rescanAssessment: vitest.fn() };
  register(tokenRescanAssessmentUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new RescanAssessmentAdapter() };
};
