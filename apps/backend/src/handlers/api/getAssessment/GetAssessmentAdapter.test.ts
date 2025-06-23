import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { NotFoundError, tokenGetAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetAssessmentAdapter } from './GetAssessmentAdapter';

describe('GetAssessmentAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();
      const response = await adapter.handle(event);

      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters(null)
        .build();

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
  });

  describe('useCase', () => {
    it('should call useCase with assessmentId', async () => {
      const { adapter, useCase } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ assessmentId: 'assessment-id' })
      );
    });

    it('should return a 200 status code', async () => {
      const { adapter, useCase } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();
      const assessment = AssessmentMother.basic().build();
      useCase.getAssessment.mockResolvedValue(assessment);

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });

    it('should return a 404 if useCase throws a NotFoundError', async () => {
      const { adapter, useCase } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();
      useCase.getAssessment.mockRejectedValue(new NotFoundError());

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(404);
    });

    it('should return a formatted assessment', async () => {
      const { adapter, useCase, date } = setup();

      const event = APIGatewayProxyEventMother.basic()
        .withPathParameters({ assessmentId: 'assessment-id' })
        .build();
      const assessment = AssessmentMother.basic()
        .withCreatedAt(date)
        .withCreatedBy('user-id')
        .withFindings([
          PillarMother.basic()
            .withDisabled(false)
            .withId('pillar-id')
            .withLabel('pillar')
            .withQuestions([
              QuestionMother.basic()
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withDescription('best practice description')
                    .withId('best-practice-id')
                    .withLabel('best practice')
                    .withResults(['prowler#1', 'prowler#2'])
                    .withRisk(SeverityType.Medium)
                    .withChecked(true)
                    .build(),
                ])
                .withDisabled(false)
                .withId('question-id')
                .withLabel('question')
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .withGraphData({
          findings: 2,
          regions: { 'us-west-2': 2 },
          resourceTypes: { type: 2 },
          severities: { [SeverityType.Medium]: 2 },
        })
        .withId('assessment-id')
        .withName('assessment name')
        .withOrganization('test.io')
        .withQuestionVersion('1.0.0')
        .withRawGraphData({
          [ScanningTool.PROWLER]: {
            findings: 2,
            regions: { 'us-west-2': 2 },
            resourceTypes: { type: 2 },
            severities: { [SeverityType.Medium]: 2 },
          },
        })
        .withRegions(['us-west-2'])
        .withRoleArn('role-arn')
        .withStep(AssessmentStep.FINISHED)
        .withWorkflows([])
        .build();

      useCase.getAssessment.mockResolvedValue(assessment);
      const response = await adapter.handle(event);
      expect(JSON.parse(response.body)).toEqual({
        created_at: date.toISOString(),
        created_by: 'user-id',
        findings: [
          {
            disabled: false,
            id: 'pillar-id',
            label: 'pillar',
            questions: [
              {
                best_practices: [
                  {
                    description: 'best practice description',
                    id: 'best-practice-id',
                    label: 'best practice',
                    results: ['prowler#1', 'prowler#2'],
                    risk: SeverityType.Medium,
                    checked: true,
                  },
                ],
                disabled: false,
                id: 'question-id',
                label: 'question',
                none: false,
              },
            ],
          },
        ],
        graph_datas: {
          findings: 2,
          regions: { 'us-west-2': 2 },
          resource_types: { type: 2 },
          severities: { [SeverityType.Medium]: 2 },
        },
        id: 'assessment-id',
        name: 'assessment name',
        organization: 'test.io',
        question_version: '1.0.0',
        raw_graph_datas: {
          prowler: {
            findings: 2,
            regions: { 'us-west-2': 2 },
            resource_types: { type: 2 },
            severities: { [SeverityType.Medium]: 2 },
          },
        },
        regions: ['us-west-2'],
        role_arn: 'role-arn',
        step: AssessmentStep.FINISHED,
        workflows: [],
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { getAssessment: vitest.fn() };
  register(tokenGetAssessmentUseCase, { useValue: useCase });
  const date = new Date();
  vitest.setSystemTime(date);
  return { useCase, adapter: new GetAssessmentAdapter(), date };
};
