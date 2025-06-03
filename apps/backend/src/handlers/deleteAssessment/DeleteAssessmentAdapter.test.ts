import { NotFoundError, tokenDeleteAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { DeleteAssessmentAdapter } from './DeleteAssessmentAdapter';
import { APIGatewayProxyEventMother } from '../../utils/APIGatewayProxyEventMother';

describe('deleteAssessment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ invalid: 'pathParameters' })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with assessmentId', async () => {
      const { adapter, useCase } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();

      await adapter.handle(event);
      expect(useCase.deleteAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ assessmentId: 'assessment-id' })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();

      useCase.deleteAssessment.mockRejectedValue(
        new NotFoundError('Assessment not found')
      );

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
    });
  });
});

const setup = () => {
  reset();
  const useCase = { deleteAssessment: vitest.fn() };
  register(tokenDeleteAssessmentUseCase, { useValue: useCase });
  const adapter = new DeleteAssessmentAdapter();
  return { useCase, adapter };
};
