import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenUpdatePillarUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { UpdatePillarAdapter } from './UpdatePillarAdapter';
import { UpdatePillarAdapterEventMother } from './UpdatePillarAdapterEventMother';

describe('updatePillar adapter', () => {
  describe('args validation', () => {
    it('should validate args parameters', async () => {
      const { adapter } = setup();

      const event = UpdatePillarAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = UpdatePillarAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
        })
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

      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with empty body parameters', async () => {
      const { adapter } = setup();

      const event = UpdatePillarAdapterEventMother.basic().withBody({}).build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const pillarId = '1';
      const pillarBody = { disabled: true };
      const event = UpdatePillarAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withPillarId(pillarId)
        .withBody(pillarBody)
        .build();

      await adapter.handle(event);

      expect(useCase.updatePillar).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
          pillarId,
          pillarBody,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { updatePillar: vitest.fn() };
  register(tokenUpdatePillarUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new UpdatePillarAdapter() };
};
