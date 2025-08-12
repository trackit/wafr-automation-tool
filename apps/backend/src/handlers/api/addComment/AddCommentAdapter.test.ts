import { registerTestInfrastructure } from '@backend/infrastructure';
import { reset } from '@shared/di-container';

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
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const adapter = new AddCommentAdapter();
  return { adapter };
};
