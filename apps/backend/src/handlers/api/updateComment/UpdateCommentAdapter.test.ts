import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenUpdateCommentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { UpdateCommentAdapter } from './UpdateCommentAdapter';
import { UpdateCommentAdapterEventMother } from './UpdateCommentAdapterEventMother';

describe('updateComment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = UpdateCommentAdapterEventMother.basic().build();

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

      const event = UpdateCommentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid commentId', async () => {
      const { adapter } = setup();

      const event = UpdateCommentAdapterEventMother.basic()
        .withCommentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with path parameters and user', async () => {
      const { adapter, useCase } = setup();

      const event = UpdateCommentAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withFindingId('finding-id')
        .withCommentId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withText('comment-text')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.updateComment).toHaveBeenCalledWith({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'finding-id',
        commentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        commentBody: {
          text: 'comment-text',
        },
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = UpdateCommentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { updateComment: vitest.fn() };
  useCase.updateComment.mockResolvedValueOnce(Promise.resolve());
  register(tokenUpdateCommentUseCase, { useValue: useCase });
  const adapter = new UpdateCommentAdapter();
  return { useCase, adapter };
};
