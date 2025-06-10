import { NotFoundError, tokenUpdateAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { UpdateAssessmentAdapter } from './UpdateAssessmentAdapter';
import { APIGatewayProxyEventMother } from '../../utils/APIGatewayProxyEventMother';
import { UpdateAssessmentAdapterArgsMother } from './UpdateAssessmentAdapterArgsMother';

describe('UpdateAssessmentAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = UpdateAssessmentAdapterArgsMother.basic().build();
      const response = await adapter.handle(event);

      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ invalid: 'pathParameters' })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with empty name', async () => {
      const { adapter } = setup();

      const event = UpdateAssessmentAdapterArgsMother.basic()
        .withName('')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and return value', () => {
    it('should call useCase with assessmentId and assessment body', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateAssessmentAdapterArgsMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withName('New Assessment Name')
        .build();

      await adapter.handle(event);
      expect(useCase.updateAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
          assessmentData: {
            name: 'New Assessment Name',
          },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateAssessmentAdapterArgsMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withName('New Assessment Name')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateAssessmentAdapterArgsMother.basic().build();

      useCase.updateAssessment.mockRejectedValue(
        new NotFoundError('Assessment not found')
      );

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
    });
  });
});

const setup = () => {
  reset();
  const useCase = { updateAssessment: vitest.fn() };
  register(tokenUpdateAssessmentUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdateAssessmentAdapter() };
};
