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
import { tokenGetAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import { GetAssessmentAdapter } from './GetAssessmentAdapter';
import { GetAssessmentAdapterEventMother } from './GetAssessmentAdapterEventMother';

describe('GetAssessmentAdapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should return a 400 without parameters', async () => {
      const { adapter } = setup();

      const event = APIGatewayProxyEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });

    it('should return a 400 with invalid assessmentId', async () => {
      const { adapter } = setup();

      const event = GetAssessmentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe('useCase and return value', () => {
    it('should call useCase with valid args', async () => {
      const { adapter, useCase } = setup();

      const event = GetAssessmentAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        })
      );
    });

    it('should return a formatted assessment', async () => {
      const { adapter, useCase, date } = setup();

      const event = GetAssessmentAdapterEventMother.basic()
        .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .build();
      const assessment = AssessmentMother.basic()
        .withCreatedAt(date)
        .withCreatedBy('user-id')
        .withPillars([
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
                    .withResults(new Set(['prowler#1', 'prowler#2']))
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
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        createdAt: date.toISOString(),
        createdBy: 'user-id',
        pillars: [
          {
            disabled: false,
            id: 'pillar-id',
            label: 'pillar',
            questions: [
              {
                bestPractices: [
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
        graphData: {
          findings: 2,
          regions: { 'us-west-2': 2 },
          resourceTypes: { type: 2 },
          severities: { [SeverityType.Medium]: 2 },
        },
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        name: 'assessment name',
        organization: 'test.io',
        questionVersion: '1.0.0',
        regions: ['us-west-2'],
        roleArn: 'role-arn',
        step: AssessmentStep.FINISHED,
        workflows: [],
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter, useCase } = setup();

      const event = GetAssessmentAdapterEventMother.basic().build();

      const assessment = AssessmentMother.basic().build();
      useCase.getAssessment.mockResolvedValue(assessment);

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
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
