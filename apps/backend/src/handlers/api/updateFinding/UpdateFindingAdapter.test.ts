import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdateFindingUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdateFindingAdapter } from './UpdateFindingAdapter';
import { UpdateFindingAdapterEventMother } from './UpdateFindingAdapterEventMother';

describe('UpdateFindingAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = UpdateFindingAdapterEventMother.basic().build();

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

      const event = UpdateFindingAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase call and return value', () => {
    it('should call useCase with findingId and FindingData', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateFindingAdapterEventMother.basic()
        .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
        .withFindingId('scanning-tool#12345')
        .withHidden(true)
        .build();

      await adapter.handle(event);

      expect(useCase.updateFinding).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
          findingId: 'scanning-tool#12345',
          findingBody: {
            hidden: true,
          },
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateFindingAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { updateFinding: vitest.fn() };
  register(tokenUpdateFindingUseCase, { useValue: useCase });
  return { useCase, adapter: new UpdateFindingAdapter() };
};
