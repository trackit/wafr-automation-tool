import { registerTestInfrastructure } from '@backend/infrastructure';
import { AssessmentMother, UserMother } from '@backend/models';
import { tokenGetAssessmentsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { GetAssessmentsAdapter } from './GetAssessmentsAdapter';
import { GetAssessmentsAdapterEventMother } from './GetAssessmentsAdapterEventMother';

describe('getAssessments adapter', () => {
  describe('args validation', () => {
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

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = GetAssessmentsAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          querySchema: expect.anything(),
        })
      );
    });

    it('should return a 200 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 400 if the limit is negative or 0', async () => {
      const { adapter } = setup();

      const event = GetAssessmentsAdapterEventMother.basic()
        .withLimit(-1)
        .build();
      const event2 = GetAssessmentsAdapterEventMother.basic()
        .withLimit(0)
        .build();

      const response = await adapter.handle(event);
      const response2 = await adapter.handle(event2);
      expect(response.statusCode).toBe(400);
      expect(response2.statusCode).toBe(400);
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
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const user = UserMother.basic().build();

      const limit = 10;
      const search = 'test';
      const nextToken = 'test';
      const event = GetAssessmentsAdapterEventMother.basic()
        .withLimit(limit)
        .withSearch(search)
        .withNextToken(nextToken)
        .withUser(user)
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessments).toHaveBeenCalledWith({
        limit,
        search,
        nextToken,
        user,
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
        step: assessment.step,
        error: assessment.error,
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { getAssessments: vitest.fn() };
  useCase.getAssessments.mockResolvedValueOnce(
    Promise.resolve({
      assessments: [],
    })
  );
  register(tokenGetAssessmentsUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new GetAssessmentsAdapter() };
};
