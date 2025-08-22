import {
  registerTestInfrastructure,
  tokenAssessmentsRepository,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { FindingMother } from '@backend/models';
import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { AddCommentAdapter } from './AddCommentAdapter';
import { AddCommentAdapterEventMother } from './AddCommentAdapterEventMother';

describe('addComment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = AddCommentAdapterEventMother.basic().build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid json body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().withBody('{').build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withBody(JSON.stringify({ invalid: 'body' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  it('should add a comment', async () => {
    const { adapter, assessmentsRepository, date } = setup();

    assessmentsRepository.saveFinding({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      finding: FindingMother.basic()
        .withId('finding-id')
        .withComments([])
        .build(),
    });

    const event = APIGatewayProxyEventMother.basic()
      .withPathParameters({
        assessmentId: 'assessment-id',
        findingId: 'finding-id',
      })
      .withBody(JSON.stringify({ text: 'comment-text' }))
      .build();

    const response = await adapter.handle(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(
      JSON.stringify({
        id: 'fake-id-0',
        authorId: 'user-id',
        authorEmail: 'user-id@test.io',
        text: 'comment-text',
        createdAt: date.toISOString(),
      })
    );

    const updatedFinding = await assessmentsRepository.getFinding({
      assessmentId: 'assessment-id',
      organization: 'test.io',
      findingId: 'finding-id',
    });
    expect(updatedFinding?.comments?.length).toBe(1);
    expect(updatedFinding?.comments?.[0].text).toBe('comment-text');
  });
  it('should return 404 if finding does not exist', async () => {
    const { adapter } = setup();

    const event = APIGatewayProxyEventMother.basic()
      .withPathParameters({
        assessmentId: 'assessment-id',
        findingId: 'finding-id',
      })
      .withBody(JSON.stringify({ text: 'comment-text' }))
      .build();

    const response = await adapter.handle(event);
    expect(response.statusCode).toBe(404);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const date = new Date();
  vitest.setSystemTime(date);
  const adapter = new AddCommentAdapter();
  const assessmentsRepository = inject(tokenAssessmentsRepository);
  return { adapter, assessmentsRepository, date };
};
