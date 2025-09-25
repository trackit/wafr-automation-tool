import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdateQuestionUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { UpdateQuestionAdapter } from './UpdateQuestionAdapter';
import { UpdateQuestionAdapterEventMother } from './UpdateQuestionAdapterEventMother';

describe('updateQuestion adapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdateQuestionAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = UpdateQuestionAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
        })
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

      const event = UpdateQuestionAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '14270881-e4b0-4f89-8941-449eed22071d';
      const pillarId = '1';
      const questionId = '2';
      const questionBody = { disabled: true, none: false };
      const event = UpdateQuestionAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withPillarId(pillarId)
        .withQuestionId(questionId)
        .withDisabled(questionBody.disabled)
        .withNone(questionBody.none)
        .build();

      await adapter.handle(event);

      expect(useCase.updateQuestion).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
          pillarId,
          questionId,
          questionBody,
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateQuestionAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { updateQuestion: vitest.fn() };
  register(tokenUpdateQuestionUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new UpdateQuestionAdapter() };
};
