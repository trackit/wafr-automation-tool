import { registerTestInfrastructure } from '@backend/infrastructure';
import { AssessmentMother } from '@backend/models';
import { tokenGetAssessmentGraphUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetAssessmentGraphAdapter } from './GetAssessmentGraphAdapter';
import { GetAssessmentGraphAdapterEventMother } from './GetAssessmentGraphAdapterEventMother';

describe('GetAssessmentGraphAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetAssessmentGraphAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters(null)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid parameters', async () => {
      const { adapter } = setup();

      const event = GetAssessmentGraphAdapterEventMother.basic()
        .withAssessmentId('invalid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should pass without query parameters', async () => {
      const { adapter } = setup();

      const event = GetAssessmentGraphAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('useCase', () => {
    it('should call useCase with correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const event = GetAssessmentGraphAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessmentGraph).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
        }),
      );
    });

    it('should call useCase with version', async () => {
      const { adapter, useCase } = setup();

      const version = 1;
      const event = GetAssessmentGraphAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withVersion(version)
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessmentGraph).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          version,
        }),
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter, useCase } = setup();

      const event = GetAssessmentGraphAdapterEventMother.basic().build();

      const assessment = AssessmentMother.basic().build();
      useCase.getAssessmentGraph.mockResolvedValue(assessment);

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { getAssessmentGraph: vi.fn() };
  register(tokenGetAssessmentGraphUseCase, { useValue: useCase });

  return { useCase, adapter: new GetAssessmentGraphAdapter() };
};
