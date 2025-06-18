import {
  NoContentError,
  NotFoundError,
  tokenUpdateQuestionUseCase,
} from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdateQuestionAdapter } from './UpdateQuestionAdapter';
import { UpdateQuestionAdapterEventMother } from './UpdateQuestionAdapterEventMother';

describe('UpdateQuestionAdapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdateQuestionAdapterEventMother.basic().build();
      const response = await adapter.handle(event);

      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters(null)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: 'assessment-id',
          pillarId: '1',
          questionId: '2',
        })
        .withBody(JSON.stringify({ test: true }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and status code', () => {
    it('should call useCase with path parameters and QuestionBody', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateQuestionAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withPillarId('1')
        .withQuestionId('2')
        .withDisabled(true)
        .withNone(false)
        .build();

      await adapter.handle(event);

      expect(useCase.updateQuestion).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
          pillarId: '1',
          questionId: '2',
          questionBody: { disabled: true, none: false },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateQuestionAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withPillarId('1')
        .withQuestionId('2')
        .withDisabled(false)
        .withNone(false)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 204 if useCase throws a NoContentError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateQuestionAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withPillarId('1')
        .withQuestionId('2')
        .build();
      useCase.updateQuestion.mockRejectedValue(new NoContentError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(204);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateQuestionAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withPillarId('1')
        .withQuestionId('2')
        .build();
      useCase.updateQuestion.mockRejectedValue(new NotFoundError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
    });
  });
});

const setup = () => {
  reset();
  const useCase = { updateQuestion: vitest.fn() };
  register(tokenUpdateQuestionUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdateQuestionAdapter() };
};
