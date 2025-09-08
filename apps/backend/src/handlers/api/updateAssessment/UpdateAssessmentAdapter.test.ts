import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdateAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdateAssessmentAdapter } from './UpdateAssessmentAdapter';
import { UpdateAssessmentAdapterEventMother } from './UpdateAssessmentAdapterEventMother';

describe('UpdateAssessmentAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = UpdateAssessmentAdapterEventMother.basic().build();

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

      const event = UpdateAssessmentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and return value', () => {
    it('should call useCase with assessmentId and assessment body', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateAssessmentAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withName('New Assessment Name')
        .build();

      await adapter.handle(event);
      expect(useCase.updateAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
          assessmentBody: {
            name: 'New Assessment Name',
          },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { updateAssessment: vitest.fn() };
  register(tokenUpdateAssessmentUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdateAssessmentAdapter() };
};
