import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenDeleteAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { DeleteAssessmentAdapter } from './DeleteAssessmentAdapter';
import { DeleteAssessmentAdapterEventMother } from './DeleteAssessmentAdapterEventMother';

describe('deleteAssessment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = DeleteAssessmentAdapterEventMother.basic().build();

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

      const event = DeleteAssessmentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with assessmentId', async () => {
      const { adapter, useCase } = setup();

      const event = DeleteAssessmentAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);
      expect(useCase.deleteAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = DeleteAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { deleteAssessment: vitest.fn() };
  register(tokenDeleteAssessmentUseCase, { useValue: useCase });
  const adapter = new DeleteAssessmentAdapter();
  return { useCase, adapter };
};
