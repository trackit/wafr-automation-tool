import { registerTestInfrastructure } from '@backend/infrastructure';
import { AssessmentMother, UserMother } from '@backend/models';
import { tokenGetAssessmentsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { GetAssessmentsAdapter } from './GetAssessmentsAdapter';
import { GetAssessmentsAdapterEventMother } from './GetAssessmentsAdapterEventMother';

describe('getAssessments adapter', () => {
  describe('query parameters validation', () => {
    it('should validate parameters', async () => {
      const { adapter } = setup();

      const event = GetAssessmentsAdapterEventMother.basic()
        .withLimit(10)
        .withSearch('test')
        .withNextToken('dGVzdCBiYXNlNjQ=')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 400 if the limit is negative', async () => {
      const { adapter } = setup();

      const event = GetAssessmentsAdapterEventMother.basic()
        .withLimit(-1)
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 if the next token is not in base64', async () => {
      const { adapter } = setup();

      const event = GetAssessmentsAdapterEventMother.basic()
        .withNextToken('NOT_BASE64')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should pass without query parameters', async () => {
      const { adapter } = setup();

      const event = GetAssessmentsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with query parameters and organization', async () => {
      const { adapter, useCase } = setup();

      const event = GetAssessmentsAdapterEventMother.basic()
        .withLimit(10)
        .withSearch('test')
        .withNextToken('test')
        .withUser(
          UserMother.basic()
            .withId('user-id')
            .withEmail('user-id@test.io')
            .build()
        )
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessments).toHaveBeenCalledWith({
        limit: 10,
        search: 'test',
        nextToken: 'test',
        user: expect.objectContaining({
          organizationDomain: 'test.io',
        }),
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GetAssessmentsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('convertToAPIAssessment', () => {
    it('should convert an assessment to an API assessment', () => {
      const { adapter } = setup();

      const assessment = AssessmentMother.basic().build();
      const apiAssessment = adapter.convertToAPIAssessment([assessment]);
      expect(apiAssessment).toHaveLength(1);
      expect(apiAssessment?.[0]).toEqual({
        id: assessment.id,
        name: assessment.name,
        createdBy: assessment.createdBy,
        organization: assessment.organization,
        regions: assessment.regions,
        roleArn: assessment.roleArn,
        workflows: assessment.workflows,
        createdAt: assessment.createdAt.toISOString(),
        error: assessment.error,
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getAssessments: vitest.fn() };
  useCase.getAssessments.mockResolvedValueOnce(
    Promise.resolve({
      assessments: [],
    })
  );
  register(tokenGetAssessmentsUseCase, { useValue: useCase });
  const adapter = new GetAssessmentsAdapter();
  return { useCase, adapter };
};
