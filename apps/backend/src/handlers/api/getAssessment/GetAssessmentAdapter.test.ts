import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { tokenGetAssessmentUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';
import * as parseApiEventModule from '../../../utils/api/parseApiEvent/parseApiEvent';
import { GetAssessmentAdapter } from './GetAssessmentAdapter';
import { GetAssessmentAdapterEventMother } from './GetAssessmentAdapterEventMother';

describe('getAssessment adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      const event = GetAssessmentAdapterEventMother.basic().build();

      const response = await adapter.handle(event);
      expect(response.statusCode).not.toBe(400);
    });

    it('should call parseApiEvent with the correct parameters', async () => {
      const { adapter, parseSpy } = setup();

      const event = GetAssessmentAdapterEventMother.basic().build();

      await adapter.handle(event);

      expect(parseSpy).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          pathSchema: expect.anything(),
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

      const event = GetAssessmentAdapterEventMother.basic()
        .withAssessmentId('invalid-uuid')
        .build();

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(400);
    });
  });
  describe('useCase and return value', () => {
    it('should call useCase with the correct parameters', async () => {
      const { adapter, useCase } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const event = GetAssessmentAdapterEventMother.basic()
        .withAssessmentId(assessmentId)
        .build();

      await adapter.handle(event);

      expect(useCase.getAssessment).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          assessmentId,
        }),
      );
    });

    it('should return a formatted assessment', async () => {
      const { adapter, useCase, date } = setup();

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
        .withFinishedAt(new Date())
        .withWorkflows([])
        .withWAFRWorkloadArn('wafr-workload-arn')
        .withOpportunityId('O1234567')
        .build();

      const event = GetAssessmentAdapterEventMother.basic()
        .withAssessmentId(assessment.id)
        .build();
      useCase.getAssessment.mockResolvedValue({
        assessment,
        bestPracticesFindingsAmount: {
          'pillar-id': {
            'question-id': {
              'best-practice-id': 1,
            },
          },
        },
      });

      const response = await adapter.handle(event);
      expect(JSON.parse(response.body)).toEqual({
        createdAt: date.toISOString(),
        createdBy: assessment.createdBy,
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
                    findingAmount: 1,
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
        graphData: assessment.graphData,
        id: assessment.id,
        name: assessment.name,
        organization: assessment.organization,
        questionVersion: assessment.questionVersion,
        regions: assessment.regions,
        roleArn: assessment.roleArn,
        finishedAt: assessment.finishedAt?.toISOString(),
        workflows: assessment.workflows,
        wafrWorkloadArn: assessment.wafrWorkloadArn,
        opportunityId: assessment.opportunityId,
      });
    });

    it('should return a 200 status code', async () => {
      const { adapter, useCase } = setup();

      const event = GetAssessmentAdapterEventMother.basic().build();

      const assessment = AssessmentMother.basic().build();
      useCase.getAssessment.mockResolvedValue({
        assessment,
        bestPracticesFindingsAmount: {},
      });

      const response = await adapter.handle(event);
      expect(response.statusCode).toBe(200);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const parseSpy = vitest.spyOn(parseApiEventModule, 'parseApiEvent');

  const useCase = { getAssessment: vitest.fn() };
  register(tokenGetAssessmentUseCase, { useValue: useCase });

  const date = new Date();
  vitest.setSystemTime(date);

  return { parseSpy, useCase, adapter: new GetAssessmentAdapter(), date };
};
