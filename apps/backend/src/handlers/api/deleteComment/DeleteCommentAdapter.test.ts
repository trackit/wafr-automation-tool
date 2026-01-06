import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenDeleteCommentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { DeleteCommentAdapter } from './DeleteCommentAdapter';
import { DeleteCommentAdapterEventMother } from './DeleteCommentAdapterEventMother';

describe('deleteComment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = DeleteCommentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = DeleteCommentAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
        }),
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

      const event = DeleteCommentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid commentId', async () => {
      const { adapter } = setup();

      const event = DeleteCommentAdapterEventMother.basic()
        .withCommentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const findingId = 'finding-id';
      const commentId = '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const event = DeleteCommentAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withFindingId(findingId)
        .withCommentId(commentId)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.deleteComment).toHaveBeenCalledWith({
        assessmentId,
        findingId,
        commentId,
        user,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { deleteComment: vitest.fn() };
  useCase.deleteComment.mockResolvedValueOnce(Promise.resolve());
  register(tokenDeleteCommentUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new DeleteCommentAdapter() };
};
