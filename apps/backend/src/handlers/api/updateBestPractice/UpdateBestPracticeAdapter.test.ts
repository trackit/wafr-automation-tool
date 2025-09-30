import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdateBestPracticeUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { UpdateBestPracticeAdapter } from './UpdateBestPracticeAdapter';
import { UpdateBestPracticeAdapterEventMother } from './UpdateBestPracticeAdapterEventMother';

describe('updateBestPractice adapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
        }),
      );
    });

    it('should return a 400 status code without path parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with empty body parameters', async () => {
      const { adapter } = setup();

      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withBody({})
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const pillarId = '1';
      const questionId = '2';
      const bestPracticeId = '3';
      const bestPracticeBody = { checked: true };
      const event = UpdateBestPracticeAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withPillarId(pillarId)
        .withQuestionId(questionId)
        .withBestPracticeId(bestPracticeId)
        .withBody(bestPracticeBody)
        .build();

      await adapter.handle(event);

      expect(useCase.updateBestPractice).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
          pillarId,
          questionId,
          bestPracticeId,
          bestPracticeBody,
        }),
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { updateBestPractice: vitest.fn() };
  register(tokenUpdateBestPracticeUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new UpdateBestPracticeAdapter() };
};
