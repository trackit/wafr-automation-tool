import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenDeleteCommentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { DeleteCommentAdapter } from './DeleteCommentAdapter';
import { DeleteCommentAdapterEventMother } from './DeleteCommentAdapterEventMother';

describe('deleteComment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = DeleteCommentAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const event = DeleteCommentAdapterEventMother.basic()
        .withAssessmentId('assessment-id')
        .withFindingId('finding-id')
        .withCommentId('comment-id')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.deleteComment).toHaveBeenCalledWith({
        assessmentId: 'assessment-id',
        findingId: 'finding-id',
        commentId: 'comment-id',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = DeleteCommentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { deleteComment: vitest.fn() };
  useCase.deleteComment.mockResolvedValueOnce(Promise.resolve());
  register(tokenDeleteCommentUseCase, { useValue: useCase });
  const adapter = new DeleteCommentAdapter();
  return { useCase, adapter };
};
