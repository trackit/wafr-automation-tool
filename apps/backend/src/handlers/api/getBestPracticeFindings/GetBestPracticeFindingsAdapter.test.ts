import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  FindingCommentMother,
  FindingMother,
  SeverityType,
} from '@backend/models';
import { tokenGetBestPracticeFindingsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { GetBestPracticeFindingsAdapter } from './GetBestPracticeFindingsAdapter';
import { GetBestPracticeFindingsAdapterEventMother } from './GetBestPracticeFindingsAdapterEventMother';

describe('getBestPracticeFindings adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('pillar-id')
        .withQuestionId('question-id')
        .withBestPracticeId('best-practice-id')
        .withLimit(10)
        .withSearch('search-term')
        .withShowHidden(true)
        .withNextToken('YQ==')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
          querySchema: expect.anything(),
        })
      );
    });

    it('should return a 400 status code without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 status code with limit lower than or equal to 0', async () => {
      const { adapter } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withLimit(0)
        .build();
      const event2 = GetBestPracticeFindingsAdapterEventMother.basic()
        .withLimit(-1)
        .build();

      const response = await adapter.handle(event);
      const response2 = await adapter.handle(event2);
      expect(response.statusCode).toBe(400);
      expect(response2.statusCode).toBe(400);
    });

    it('should return a 400 status code with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should pass without query parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withQueryStringParameters({})
        .withPathParameters({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          pillarId: '1',
          questionId: '1',
          bestPracticeId: '1',
        })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const pillarId = 'pillar-id';
      const questionId = 'question-id';
      const bestPracticeId = 'best-practice-id';
      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .withPillarId(pillarId)
        .withQuestionId(questionId)
        .withBestPracticeId(bestPracticeId)
        .build();

      await adapter.handle(event);
      expect(useCase.getBestPracticeFindings).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
          pillarId,
          questionId,
          bestPracticeId,
        })
      );
    });

    it('should call useCase with limit, search, showHidden and nextToken', async () => {
      const { adapter, useCase } = setup();

      const limit = 10;
      const searchTerm = 'search-term';
      const showHidden = true;
      const nextToken = 'YQ==';
      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('pillar-id')
        .withQuestionId('question-id')
        .withBestPracticeId('best-practice-id')
        .withLimit(limit)
        .withSearch(searchTerm)
        .withShowHidden(showHidden)
        .withNextToken(nextToken)
        .build();

      await adapter.handle(event);
      expect(useCase.getBestPracticeFindings).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          limit,
          searchTerm,
          showHidden,
          nextToken,
        })
      );
    });

    it('should return formatted findings', async () => {
      const { adapter, useCase } = setup();

      const comment = FindingCommentMother.basic()
        .withAuthorId('user-id')
        .build();
      const findings = [
        FindingMother.basic()
          .withId('scanning-tool#1')
          .withBestPractices('0#0#0')
          .withHidden(false)
          .withIsAIAssociated(false)
          .withMetadata({ eventCode: 'event-code' })
          .withRemediation({
            desc: 'remediation description',
            references: ['ref1'],
          })
          .withResources([
            {
              name: 'resource-name',
              type: 'resource-type',
              uid: 'resource-id',
              region: 'us-east-1',
            },
          ])
          .withRiskDetails('risk details')
          .withSeverity(SeverityType.Medium)
          .withStatusCode('200')
          .withStatusDetail('status detail')
          .withComments([comment])
          .build(),
      ];

      useCase.getBestPracticeFindings.mockResolvedValue({ findings });

      const event = GetBestPracticeFindingsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      const body = JSON.parse(response.body || '{}');
      expect(body.items[0]).toEqual(
        expect.objectContaining({
          id: 'scanning-tool#1',
          severity: SeverityType.Medium,
          statusCode: '200',
          statusDetail: 'status detail',
          hidden: false,
          resources: [
            {
              uid: 'resource-id',
              name: 'resource-name',
              type: 'resource-type',
              region: 'us-east-1',
            },
          ],
          remediation: {
            desc: 'remediation description',
            references: ['ref1'],
          },
          riskDetails: 'risk details',
          isAIAssociated: false,
          comments: [
            {
              ...comment,
              createdAt: comment.createdAt.toISOString(),
              authorEmail: 'test-user@test.io',
            },
          ],
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { getBestPracticeFindings: vitest.fn() };
  useCase.getBestPracticeFindings.mockResolvedValue({
    findings: [],
    nextToken: null,
  });
  register(tokenGetBestPracticeFindingsUseCase, { useValue: useCase });

  return { parseSpy, useCase, adapter: new GetBestPracticeFindingsAdapter() };
};
