import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenRescanAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { RescanAssessmentAdapter } from './RescanAssessmentAdapter';
import { RescanAssessmentAdapterEventMother } from './RescanAssessmentAdapterEventMother';

describe('RescanAssessmentAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = RescanAssessmentAdapterEventMother.basic().build();

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

      const event = RescanAssessmentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with assessmentId', async () => {
      const { adapter, useCase } = setup();

      const event = RescanAssessmentAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .build();

      await adapter.handle(event);
      expect(useCase.rescanAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        })
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
  const useCase = { rescanAssessment: vitest.fn() };
  register(tokenRescanAssessmentUseCase, { useValue: useCase });
  const adapter = new RescanAssessmentAdapter();
  return { useCase, adapter };
};
