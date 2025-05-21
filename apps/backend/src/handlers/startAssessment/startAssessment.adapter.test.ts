import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

import { register, reset } from '@shared/di-container';
import { tokenStartAssessmentUseCase } from '@backend/useCases';

import { StartAssessmentAdapter } from './startAssessment.adapter';
import { StartAssessmentAdapterEventMother } from './StartAssessmentAdapterEventMother';
import { APIGatewayProxyEventV2Mother } from '../APIGatewayProxyEventV2Mother';

describe('startAssessment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = StartAssessmentAdapterEventMother.basic()
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/test-role')
        .withWorkflows(['workflow-1', 'workflow-2'])
        .build();

      await expect(adapter.handle(event)).resolves.not.toThrow();
    });

    it('should throw a bad request error without body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventV2Mother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid json body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventV2Mother.basic().withBody('{').build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should throw a bad request error with invalid body', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventV2Mother.basic()
        .withBody(JSON.stringify({ invalid: 'body' }))
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with deserialized body', async () => {
      const { adapter, useCase } = setup();

      const event = StartAssessmentAdapterEventMother.basic()
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/test-role')
        .withWorkflows(['workflow-1', 'workflow-2'])
        .build();

      await adapter.handle(event);

      expect(useCase.startAssessment).toHaveBeenCalledExactlyOnceWith({
        name: 'Test Assessment',
        regions: ['us-west-1', 'us-west-2'],
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        workflows: ['workflow-1', 'workflow-2'],
      });
    });

    it('should return the assessment id from the useCase', async () => {
      const { adapter } = setup();

      const event = StartAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      const body = JSON.parse(response.body ?? '{}');

      expect(body).toEqual({ assessment_id: 'assessment-id' });
    });

    it('should return a 201 status code', async () => {
      const { adapter } = setup();

      const event = StartAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(201);
    });
  });
});

const setup = () => {
  reset();
  const useCase = { startAssessment: vitest.fn() };
  useCase.startAssessment.mockResolvedValueOnce({
    assessmentId: 'assessment-id',
  });
  register(tokenStartAssessmentUseCase, { useValue: useCase });
  const adapter = new StartAssessmentAdapter();
  return { useCase, adapter };
};
