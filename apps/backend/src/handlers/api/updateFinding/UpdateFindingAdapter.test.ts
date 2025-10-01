import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdateFindingUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { UpdateFindingAdapter } from './UpdateFindingAdapter';
import { UpdateFindingAdapterEventMother } from './UpdateFindingAdapterEventMother';

describe('updateFinding adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = UpdateFindingAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = UpdateFindingAdapterEventMother.basic().build();

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

      const event = UpdateFindingAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with empty body parameters', async () => {
      const { adapter } = setup();

      const event = UpdateFindingAdapterEventMother.basic()
        .withBody({})
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '14270881-e4b0-4f89-8941-449eed22071d';
      const findingId = 'scanning-tool#12345';
      const findingBody = { hidden: true };
      const event = UpdateFindingAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withFindingId(findingId)
        .withHidden(findingBody.hidden)
        .build();

      await adapter.handle(event);

      expect(useCase.updateFinding).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
          findingId,
          findingBody,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { updateFinding: vitest.fn() };
  register(tokenUpdateFindingUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new UpdateFindingAdapter() };
};
