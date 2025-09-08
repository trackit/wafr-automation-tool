import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdateBestPracticeUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdateBestPracticeAdapter } from './UpdateBestPracticeAdapter';
import { UpdateBestPracticeAdapterEventMother } from './UpdateBestPracticeAdapterEventMother';

describe('UpdateBestPracticeAdapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without path parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with empty body parameters', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withBody({})
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and BestPracticeBody', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('1')
        .withQuestionId('2')
        .withBestPracticeId('3')
        .withBody({ checked: true })
        .build();

      await adapter.handle(event);

      expect(useCase.updateBestPractice).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          pillarId: '1',
          questionId: '2',
          bestPracticeId: '3',
          bestPracticeBody: { checked: true },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { updateBestPractice: vitest.fn() };
  register(tokenUpdateBestPracticeUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdateBestPracticeAdapter() };
};
