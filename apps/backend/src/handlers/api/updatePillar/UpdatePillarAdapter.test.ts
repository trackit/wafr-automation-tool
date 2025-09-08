import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdatePillarUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdatePillarAdapter } from './UpdatePillarAdapter';
import { UpdatePillarAdapterEventMother } from './UpdatePillarAdapterEventMother';

describe('UpdatePillarAdapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdatePillarAdapterEventMother.basic().build();

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

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and status code', () => {
    it('should call useCase with parameters and PillarBody', async () => {
      const { adapter, useCase } = setup();

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('1')
        .withBody({ disabled: true })
        .build();

      await adapter.handle(event);

      expect(useCase.updatePillar).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          pillarId: '1',
          pillarBody: { disabled: true },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdatePillarAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
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
