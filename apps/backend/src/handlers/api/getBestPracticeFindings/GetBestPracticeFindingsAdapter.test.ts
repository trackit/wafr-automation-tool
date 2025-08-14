import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  FindingCommentMother,
  FindingMother,
  SeverityType,
} from '@backend/models';
import {
  NotFoundError,
  tokenGetBestPracticeFindingsUseCase,
} from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetBestPracticeFindingsAdapter } from './GetBestPracticeFindingsAdapter';
import { GetBestPracticeFindingsAdapterEventMother } from './GetBestPracticeFindingsAdapterEventMother';

describe('GetBestPracticeFindings adapter', () => {
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

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ invalid: 'pathParameters' })
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with limit lower than or equal to 0', async () => {
      const { adapter } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('pillar-id')
        .withQuestionId('question-id')
        .withBestPracticeId('best-practice-id')
        .withLimit(0)
        .build();
      const event2 = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('pillar-id')
        .withQuestionId('question-id')
        .withBestPracticeId('best-practice-id')
        .withLimit(-1)
        .build();

      const response = await adapter.handle(event);
      const response2 = await adapter.handle(event2);
      expect(response.statusCode).toBe(400);
      expect(response2.statusCode).toBe(400);
    });
  });

  describe('useCase', () => {
    it('should call useCase with assessmentId, pillarId, questionId, bestPracticeId', async () => {
      const { adapter, useCase } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withPillarId('pillar-id')
        .withQuestionId('question-id')
        .withBestPracticeId('best-practice-id')
        .build();

      await adapter.handle(event);
      expect(useCase.getBestPracticeFindings).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          pillarId: 'pillar-id',
          questionId: 'question-id',
          bestPracticeId: 'best-practice-id',
        })
      );
    });

    it('should call useCase with limit, search, showHidden and nextToken', async () => {
      const { adapter, useCase } = setup();

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

      await adapter.handle(event);
      expect(useCase.getBestPracticeFindings).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          limit: 10,
          searchTerm: 'search-term',
          showHidden: true,
          nextToken: 'YQ==',
        })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter, useCase } = setup();

      const event = GetBestPracticeFindingsAdapterEventMother.basic().build();
      useCase.getBestPracticeFindings.mockResolvedValue({
        findings: [],
        nextToken: null,
      });

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      useCase.getBestPracticeFindings.mockRejectedValue(
        new NotFoundError('Not found')
      );

      const event = GetBestPracticeFindingsAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
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
              authorName: 'test-user',
            },
          ],
        })
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getBestPracticeFindings: vitest.fn() };
  register(tokenGetBestPracticeFindingsUseCase, { useValue: useCase });
  return { useCase, adapter: new GetBestPracticeFindingsAdapter() };
};
