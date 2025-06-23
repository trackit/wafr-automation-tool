import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  NoContentError,
  NotFoundError,
  tokenUpdatePillarUseCase,
} from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdatePillarAdapter } from './UpdatePillarAdapter';
import { UpdatePillarAdapterEventMother } from './UpdatePillarAdapterEventMother';

describe('UpdatePillarAdapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withBody({ disabled: true })
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
        })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and status code', () => {
    it('should call useCase with path parameters and PillarBody', async () => {
      const { adapter, useCase } = setup();

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withBody({ disabled: true })
        .build();

      await adapter.handle(event);

      expect(useCase.updatePillar).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: 'assessment-id',
          pillarId: '1',
          pillarBody: { disabled: true },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withBody({ disabled: true })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 204 if useCase throws a NoContentError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withBody({})
        .build();
      useCase.updatePillar.mockRejectedValue(new NoContentError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(204);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withPillarId('1')
        .withBody({ disabled: true })
        .build();
      useCase.updatePillar.mockRejectedValue(new NotFoundError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { updatePillar: vitest.fn() };
  register(tokenUpdatePillarUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdatePillarAdapter() };
};
