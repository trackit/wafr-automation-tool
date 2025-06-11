import {
  NoContentError,
  NotFoundError,
  tokenUpdateBestPracticeUseCase,
} from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../utils/APIGatewayProxyEventMother';
import { UpdateBestPracticeAdapter } from './UpdateBestPracticeAdapter';
import { UpdateBestPracticeAdapterEventMother } from './UpdateBestPracticeAdapterEventMother';

describe('UpdateBestPracticeAdapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withQuestionId('2')
        .withBestPracticeId('3')
        .withBody({ checked: true })
        .build();
      const response = await adapter.handle(event);

      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without path parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters(null)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid body parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: 'assessment-id',
          pillarId: '1',
          questionId: '2',
          bestPracticeId: '3',
        })
        .withBody(JSON.stringify({ test: true }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with undefined body parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: 'assessment-id',
          pillarId: '1',
          questionId: '2',
          bestPracticeId: '3',
        })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and status code', () => {
    it('should call useCase with path parameters and BestPracticeBody', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withQuestionId('2')
        .withBestPracticeId('3')
        .withBody({ checked: true })
        .build();

      await adapter.handle(event);

      expect(useCase.updateBestPractice).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: 'assessment-id',
          pillarId: '1',
          questionId: '2',
          bestPracticeId: '3',
          bestPracticeBody: { checked: true },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withQuestionId('2')
        .withBestPracticeId('3')
        .withBody({ checked: true })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 204 if useCase throws a NoContentError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withQuestionId('2')
        .withBestPracticeId('3')
        .withBody({ checked: true })
        .build();
      useCase.updateBestPractice.mockRejectedValue(new NoContentError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(204);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withQuestionId('2')
        .withBestPracticeId('3')
        .withBody({ checked: true })
        .build();
      useCase.updateBestPractice.mockRejectedValue(new NotFoundError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
    });
  });
});

const setup = () => {
  reset();
  const useCase = { updateBestPractice: vitest.fn() };
  register(tokenUpdateBestPracticeUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdateBestPracticeAdapter() };
};
