import { registerTestInfrastructure } from '@backend/infrastructure';
import { AssessmentMother, AssessmentStep } from '@backend/models';
import { tokenGetAssessmentStepUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetAssessmentStepAdapter } from './GetAssessmentStepAdapter';
import { GetAssessmentStepAdapterEventMother } from './GetAssessmentStepAdapterEventMother';

describe('GetAssessmentStepAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetAssessmentStepAdapterEventMother.basic().build();
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

      const event = GetAssessmentStepAdapterEventMother.basic()
        .withAssessmentId('invalid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase', () => {
    it('should call useCase with correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const event = GetAssessmentStepAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessmentStep).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
        }),
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter, useCase } = setup();

      const event = GetAssessmentStepAdapterEventMother.basic().build();

      const assessment = AssessmentMother.basic().build();
      useCase.getAssessmentStep.mockResolvedValue(assessment);

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return an object with the assessment step from use case', async () => {
      const { adapter, useCase } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        })
        .build();
      useCase.getAssessmentStep.mockResolvedValue(
        AssessmentStep.PREPARING_ASSOCIATIONS,
      );

      const response = await adapter.handle(event);
      expect(JSON.parse(response.body)).toEqual({
        step: AssessmentStep.PREPARING_ASSOCIATIONS,
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const useCase = { getAssessmentStep: vi.fn() };
  register(tokenGetAssessmentStepUseCase, { useValue: useCase });

  return { useCase, adapter: new GetAssessmentStepAdapter() };
};
