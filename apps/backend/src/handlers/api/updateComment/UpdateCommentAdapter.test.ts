import { registerTestInfrastructure } from '@backend/infrastructure';
import { UserMother } from '@backend/models';
import { tokenUpdateCommentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
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

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = UpdateCommentAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          bodySchema: expect.anything(),
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

      const event = UpdateCommentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid commentId', async () => {
      const { adapter } = setup();

      const event = UpdateCommentAdapterEventMother.basic()
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
      const text = 'comment-text';
      const event = UpdateCommentAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withFindingId(findingId)
        .withCommentId(commentId)
        .withText(text)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.updateComment).toHaveBeenCalledWith({
        assessmentId,
        findingId,
        commentId,
        commentBody: {
          text,
        },
        user,
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

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { updateComment: vitest.fn() };
  useCase.updateComment.mockResolvedValueOnce(Promise.resolve());
  register(tokenUpdateCommentUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new UpdateCommentAdapter() };
};
