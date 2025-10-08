import {
  registerTestInfrastructure,
  tokenDynamoDBAssessmentTableName,
  tokenDynamoDBDocument,
  tokenDynamoDBOrganizationTableName,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
  tokenFakeOrganizationRepository,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import {
  Assessment,
  AssessmentFileExport,
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentGraphDataMother,
  AssessmentMother,
  AssessmentStep,
  BestPractice,
  BestPracticeMother,
  Finding,
  FindingComment,
  FindingCommentMother,
  FindingMother,
  OrganizationMother,
  Pillar,
  PillarMother,
  Question,
  QuestionMother,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  DynamoDBAssessment,
  DynamoDBAssessmentFileExport,
  DynamoDBBestPractice,
  DynamoDBFinding,
  DynamoDBFindingComment,
  DynamoDBPillar,
  DynamoDBQuestion,
  MigrateDynamoAdapter,
} from './MigrateDynamoAdapter';

function toDynamoDBFindingComment(
  comment: FindingComment,
): DynamoDBFindingComment {
  return {
    id: comment.id,
    authorId: comment.authorId,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  };
}

function toDynamoDBFindingItem(
  finding: Finding,
  args: {
    assessmentId: string;
    organizationDomain: string;
  },
): DynamoDBFinding {
  const { assessmentId, organizationDomain } = args;
  return {
    PK: `${organizationDomain}#${assessmentId}#FINDINGS`,
    SK: finding.id,
    bestPractices: '',
    hidden: finding.hidden,
    id: finding.id,
    isAIAssociated: finding.isAIAssociated,
    metadata: { eventCode: finding.eventCode },
    remediation: finding.remediation,
    resources: finding.resources,
    riskDetails: finding.riskDetails,
    severity: finding.severity,
    statusCode: finding.statusCode,
    statusDetail: finding.statusDetail,
    ...(finding.comments && {
      comments: Object.fromEntries(
        finding.comments.map((comment) => [
          comment.id,
          toDynamoDBFindingComment(comment),
        ]),
      ),
    }),
  };
}

export function toDynamoDBBestPracticeItem(
  bestPractice: BestPractice,
): DynamoDBBestPractice {
  return {
    description: bestPractice.description,
    id: bestPractice.id,
    label: bestPractice.label,
    primaryId: bestPractice.primaryId,
    risk: bestPractice.risk,
    checked: bestPractice.checked,
    results: new Set<string>(['']),
  };
}

export function toDynamoDBQuestionItem(question: Question): DynamoDBQuestion {
  return {
    bestPractices: question.bestPractices.reduce(
      (bestPractices, bestPractice) => ({
        ...bestPractices,
        [bestPractice.id]: toDynamoDBBestPracticeItem(bestPractice),
      }),
      {},
    ),
    disabled: question.disabled,
    id: question.id,
    label: question.label,
    none: question.none,
    primaryId: question.primaryId,
  };
}

export function toDynamoDBPillarItem(pillar: Pillar): DynamoDBPillar {
  return {
    disabled: pillar.disabled,
    id: pillar.id,
    label: pillar.label,
    primaryId: pillar.primaryId,
    questions: pillar.questions.reduce(
      (questions, question) => ({
        ...questions,
        [question.id]: toDynamoDBQuestionItem(question),
      }),
      {},
    ),
  };
}

export function toDynamoDBAssessmentItem(
  assessment: Assessment,
): DynamoDBAssessment {
  return {
    PK: assessment.organization,
    SK: `ASSESSMENT#${assessment.id}`,
    createdAt: assessment.createdAt.toISOString(),
    createdBy: assessment.createdBy,
    executionArn: assessment.executionArn || '',
    pillars: assessment.pillars?.reduce(
      (pillars, pillar) => ({
        ...pillars,
        [pillar.id]: toDynamoDBPillarItem(pillar),
      }),
      {},
    ),
    graphData: AssessmentGraphDataMother.basic().build(),
    id: assessment.id,
    name: assessment.name,
    organization: assessment.organization,
    questionVersion: assessment.questionVersion,
    rawGraphData: {},
    regions: assessment.regions,
    exportRegion: assessment.exportRegion,
    roleArn: assessment.roleArn,
    step: AssessmentStep.FINISHED,
    workflows: assessment.workflows,
    error: assessment.error,
    ...(assessment.fileExports && {
      fileExports: assessment.fileExports.reduce(
        (fileExports, fileExport) => {
          fileExports[fileExport.type][fileExport.id] =
            toDynamoDBFileExportItem(fileExport);
          return fileExports;
        },
        { [AssessmentFileExportType.PDF]: {} },
      ),
    }),
  };
}

export function toDynamoDBFileExportItem(
  assessmentFileExport: AssessmentFileExport,
): DynamoDBAssessmentFileExport {
  return {
    ...assessmentFileExport,
    createdAt: assessmentFileExport.createdAt.toISOString(),
  };
}

beforeAll(async () => {
  reset();
  registerTestInfrastructure();
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();

  // DynamoDB setup
  const dynamoDBClient = inject(tokenDynamoDBDocument);
  const assessmentsTableName = inject(tokenDynamoDBAssessmentTableName);
  const organizationsTableName = inject(tokenDynamoDBOrganizationTableName);

  const organizations = [
    OrganizationMother.basic()
      .withAccountId('111111111111')
      .withDomain('organization1')
      .withAssessmentExportRoleArn('test-arn')
      .withFreeAssessmentsLeft(2)
      .withUnitBasedAgreementId('test-agreement-id')
      .withName('Organization 1')
      .build(),
    OrganizationMother.basic()
      .withAccountId('222222222222')
      .withDomain('organization2')
      .withAssessmentExportRoleArn('test-arn-2')
      .withFreeAssessmentsLeft(3)
      .withUnitBasedAgreementId('test-agreement-id-2')
      .withName('Organization 2')
      .build(),
  ];

  const assessments = {
    organization1: [
      AssessmentMother.basic()
        .withId('cd2b1fb1-2b04-4408-8754-5ec3f25e963c')
        .withName('assessment 1')
        .withOrganization('organization1')
        .withCreatedBy('user-id')
        .withFileExports([
          AssessmentFileExportMother.basic()
            .withId('file-export-id-1')
            .withType(AssessmentFileExportType.PDF)
            .withStatus(AssessmentFileExportStatus.COMPLETED)
            .withObjectKey('export-key-1')
            .build(),
        ])
        .withPillars([
          PillarMother.basic()
            .withDisabled(false)
            .withId('pillar-id')
            .withLabel('pillar')
            .withQuestions([
              QuestionMother.basic()
                .withId('question-id')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('best-practice-id')
                    .withDescription('best practice description')
                    .withLabel('best practice')
                    .withRisk(SeverityType.Medium)
                    .withChecked(true)
                    .build(),
                ])
                .withDisabled(false)
                .withLabel('question')
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .withQuestionVersion('1.0.0')
        .withRegions(['us-west-2'])
        .withRoleArn('role-arn')
        .withWorkflows([])
        .build(),
      AssessmentMother.basic()
        .withId('b0481fc6-8af4-42fd-b479-e99f471bff2a')
        .withName('assessment 2')
        .withCreatedBy('user-id-2')
        .withOrganization('organization1')
        .withPillars([])
        .build(),
    ],
    organization2: [
      AssessmentMother.basic()
        .withId('957b4d8d-3e01-4798-8642-234e38bfefd8')
        .withOrganization('organization2')
        .withName('assessment 4')
        .withCreatedBy('user-id-3')
        .withPillars([
          PillarMother.basic()
            .withDisabled(false)
            .withId('pillar-id')
            .withLabel('pillar')
            .withQuestions([
              QuestionMother.basic()
                .withId('question-id')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('best-practice-id')
                    .withDescription('best practice description')
                    .withLabel('best practice')
                    .withRisk(SeverityType.Medium)
                    .withChecked(true)
                    .build(),
                ])
                .withDisabled(false)
                .withLabel('question')
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .build(),
    ],
  };
  const findings = {
    organization1: [
      [
        FindingMother.basic()
          .withResources([
            {
              name: 'resource-1',
              type: 'type',
              region: 'us-west-2',
              uid: 'uid-1',
            },
            {
              name: 'resource-2',
              type: 'type',
              region: 'us-west-2',
              uid: 'uid-2',
            },
          ])
          .withComments([
            FindingCommentMother.basic()
              .withId('adccab9b-ed4a-4279-af71-3e4b6d542cde')
              .withText('This is a comment')
              .build(),
            FindingCommentMother.basic()
              .withId('9dac753b-7587-45d7-ba28-66645d7569e3')
              .withText('This is another comment')
              .build(),
          ])
          .withId('prowler#1')
          .withRemediation({
            desc: 'remediation description',
            references: ['https://example.com'],
          })
          .build(),
        FindingMother.basic()
          .withId('prowler#2')
          .withResources([])
          .withComments([])
          .build(),
      ],
      [],
    ],
    organization2: [
      [
        FindingMother.basic()
          .withId('prowler#4')
          .withResources([])
          .withComments([])
          .build(),
      ],
    ],
  };

  // Insert Orgs
  for (const org of organizations) {
    await dynamoDBClient.put({
      TableName: organizationsTableName,
      Item: {
        PK: org.domain,
        ...org,
      },
    });
  }

  // Insert Assessments + Findings
  for (const [orgDomain, orgAssessments] of Object.entries(assessments)) {
    // Insert Assessments for Org
    for (let i = 0; i < orgAssessments.length; i++) {
      const assessment = orgAssessments[i];
      await dynamoDBClient.put({
        TableName: assessmentsTableName,
        Item: toDynamoDBAssessmentItem(assessment),
      });

      // Insert Findings for Assessment
      for (const finding of findings[orgDomain][i]) {
        await dynamoDBClient.put({
          TableName: assessmentsTableName,
          Item: toDynamoDBFindingItem(finding, {
            assessmentId: assessment.id,
            organizationDomain: orgDomain,
          }),
        });
      }

      // Link All Findings to Assessment Best Practice
      if (findings[orgDomain][i].length === 0) {
        continue;
      }
      const newFindings = new Set<string>([
        ...findings[orgDomain][i].map((f) => f.id),
      ]);
      await dynamoDBClient.update({
        TableName: assessmentsTableName,
        Key: {
          PK: assessment.organization,
          SK: `ASSESSMENT#${assessment.id}`,
        },
        UpdateExpression: `
          ADD pillars.#pillar.questions.#question.bestPractices.#bestPractice.results :newFindings
        `,
        ExpressionAttributeNames: {
          '#pillar': 'pillar-id',
          '#question': 'question-id',
          '#bestPractice': 'best-practice-id',
        },
        ExpressionAttributeValues: {
          ':newFindings': newFindings,
        },
      });
      for (const finding of findings[orgDomain][i]) {
        const bestPractices = 'pillar-id#question-id#best-practice-id';
        await dynamoDBClient.update({
          TableName: assessmentsTableName,
          Key: {
            PK: `${orgDomain}#${assessment.id}#FINDINGS`,
            SK: finding.id,
          },
          UpdateExpression: `
            SET bestPractices = :best_practices
          `,
          ExpressionAttributeValues: {
            ':best_practices': bestPractices,
          },
        });
      }
    }
  }
});

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
  await clientManager.closeConnections();
});

afterAll(async () => {
  const deleteItemsFromTable = async (tableName: string, hasSK?: boolean) => {
    const dynamoDBClient = inject(tokenDynamoDBDocument);
    const scanResult = await dynamoDBClient.scan({
      TableName: tableName,
    });
    await Promise.all(
      (scanResult.Items || []).map(async (item) => {
        await dynamoDBClient.delete({
          TableName: tableName,
          Key: {
            PK: item.PK,
            ...(hasSK ? { SK: item.SK } : {}),
          },
        });
      }),
    );
  };

  const assessmentsTableName = inject(tokenDynamoDBAssessmentTableName);
  const organizationsTableName = inject(tokenDynamoDBOrganizationTableName);
  await deleteItemsFromTable(assessmentsTableName, true);
  await deleteItemsFromTable(organizationsTableName);
});

describe('migrateDynamo adapter', () => {
  describe('args validation', () => {
    it('should validate args', async () => {
      const { adapter } = setup();

      await expect(adapter.handle()).resolves.not.toThrow();
    });
  });

  describe('adapter', () => {
    it('should migrate organization', async () => {
      const { adapter, fakeOrganizationRepository } = setup();

      await adapter.handle();

      // Validate Org 1 Data
      const org1 = await fakeOrganizationRepository.get('organization1');
      expect(org1).toEqual({
        domain: 'organization1',
        accountId: '111111111111',
        assessmentExportRoleArn: 'test-arn',
        freeAssessmentsLeft: 2,
        unitBasedAgreementId: 'test-agreement-id',
        name: 'Organization 1',
      });

      // Validate Org 2 Data
      const org2 = await fakeOrganizationRepository.get('organization2');
      expect(org2).toEqual({
        domain: 'organization2',
        accountId: '222222222222',
        assessmentExportRoleArn: 'test-arn-2',
        freeAssessmentsLeft: 3,
        unitBasedAgreementId: 'test-agreement-id-2',
        name: 'Organization 2',
      });
    });

    it('should migrate assessments', async () => {
      const { adapter, fakeAssessmentsRepository } = setup();

      await adapter.handle();

      // Validate Org 1 Assessments
      const org1Assessment1 = await fakeAssessmentsRepository.getAll({
        organizationDomain: 'organization1',
      });
      expect(
        org1Assessment1.assessments.sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      ).toEqual([
        expect.objectContaining({
          id: 'cd2b1fb1-2b04-4408-8754-5ec3f25e963c',
          name: 'assessment 1',
          organization: 'organization1',
          createdBy: 'user-id',
          regions: ['us-west-2'],
          roleArn: 'role-arn',
          pillars: [
            expect.objectContaining({
              id: 'pillar-id',
              label: 'pillar',
              questions: [
                expect.objectContaining({
                  id: 'question-id',
                  label: 'question',
                  bestPractices: [
                    expect.objectContaining({
                      id: 'best-practice-id',
                      label: 'best practice',
                      description: 'best practice description',
                      risk: SeverityType.Medium,
                      checked: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
          workflows: [],
        }),
        expect.objectContaining({
          id: 'b0481fc6-8af4-42fd-b479-e99f471bff2a',
          name: 'assessment 2',
          organization: 'organization1',
          createdBy: 'user-id-2',
          pillars: [],
        }),
      ]);

      // Validate Org 2 Assessments
      const org2Assessment1 = await fakeAssessmentsRepository.getAll({
        organizationDomain: 'organization2',
      });
      expect(org2Assessment1.assessments).toEqual([
        expect.objectContaining({
          id: '957b4d8d-3e01-4798-8642-234e38bfefd8',
          name: 'assessment 4',
          organization: 'organization2',
          createdBy: 'user-id-3',
          pillars: [
            expect.objectContaining({
              id: 'pillar-id',
              label: 'pillar',
              questions: [
                expect.objectContaining({
                  id: 'question-id',
                  label: 'question',
                  bestPractices: [
                    expect.objectContaining({
                      id: 'best-practice-id',
                      label: 'best practice',
                      description: 'best practice description',
                      risk: SeverityType.Medium,
                      checked: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ]);
    });

    it('should migrate assessments file exports', async () => {
      const { adapter, fakeAssessmentsRepository } = setup();

      await adapter.handle();

      // Validate Org 1 Assessment 1 File Exports
      const org1Assessment1 = await fakeAssessmentsRepository.get({
        organizationDomain: 'organization1',
        assessmentId: 'cd2b1fb1-2b04-4408-8754-5ec3f25e963c',
      });
      expect(org1Assessment1?.fileExports).toEqual([
        expect.objectContaining({
          id: 'file-export-id-1',
          type: AssessmentFileExportType.PDF,
          status: AssessmentFileExportStatus.COMPLETED,
          objectKey: 'export-key-1',
        }),
      ]);

      // Validate Org 1 Assessment 2 File Exports
      const org1Assessment2 = await fakeAssessmentsRepository.get({
        organizationDomain: 'organization1',
        assessmentId: 'b0481fc6-8af4-42fd-b479-e99f471bff2a',
      });
      expect(org1Assessment2?.fileExports).toEqual([]);

      // Validate Org 2 Assessment 1 File Exports
      const org2Assessment1 = await fakeAssessmentsRepository.get({
        organizationDomain: 'organization2',
        assessmentId: '957b4d8d-3e01-4798-8642-234e38bfefd8',
      });
      expect(org2Assessment1?.fileExports).toEqual([]);
    });

    it('should migrate findings', async () => {
      const { adapter, fakeFindingsRepository } = setup();

      await adapter.handle();

      // Validate Org 1 Assessment 1 Findings
      const org1Assessment1Findings = await fakeFindingsRepository.getAll({
        organizationDomain: 'organization1',
        assessmentId: 'cd2b1fb1-2b04-4408-8754-5ec3f25e963c',
      });
      expect(org1Assessment1Findings).toEqual([
        expect.objectContaining({
          id: 'prowler#1',
          resources: [
            {
              name: 'resource-1',
              type: 'type',
              region: 'us-west-2',
              uid: 'uid-1',
            },
            {
              name: 'resource-2',
              type: 'type',
              region: 'us-west-2',
              uid: 'uid-2',
            },
          ],
          remediation: {
            desc: 'remediation description',
            references: ['https://example.com'],
          },
        }),
        expect.objectContaining({
          id: 'prowler#2',
          resources: [],
          comments: [],
        }),
      ]);

      // Validate Org 1 Assessment 2 Findings
      const org1Assessment2Findings = await fakeFindingsRepository.getAll({
        organizationDomain: 'organization1',
        assessmentId: 'b0481fc6-8af4-42fd-b479-e99f471bff2a',
      });
      expect(org1Assessment2Findings).toEqual([]);

      // Validate Org 2 Assessment 1 Findings
      const org2Assessment1Findings = await fakeFindingsRepository.getAll({
        organizationDomain: 'organization2',
        assessmentId: '957b4d8d-3e01-4798-8642-234e38bfefd8',
      });
      expect(org2Assessment1Findings).toEqual([
        expect.objectContaining({
          id: 'prowler#4',
          resources: [],
          comments: [],
        }),
      ]);
    });

    it('should migrate findings comments', async () => {
      const { adapter, fakeFindingsRepository } = setup();

      await adapter.handle();

      // Validate Org 1 Assessment 1 Findings Comments
      const org1Assessment1Finding1 = await fakeFindingsRepository.get({
        organizationDomain: 'organization1',
        assessmentId: 'cd2b1fb1-2b04-4408-8754-5ec3f25e963c',
        findingId: 'prowler#1',
      });
      expect(
        org1Assessment1Finding1?.comments?.sort((a, b) =>
          a.id.localeCompare(b.id),
        ),
      ).toEqual([
        expect.objectContaining({
          id: '9dac753b-7587-45d7-ba28-66645d7569e3',
          text: 'This is another comment',
        }),
        expect.objectContaining({
          id: 'adccab9b-ed4a-4279-af71-3e4b6d542cde',
          text: 'This is a comment',
        }),
      ]);
      const org1Assessment1Finding2 = await fakeFindingsRepository.get({
        organizationDomain: 'organization1',
        assessmentId: 'cd2b1fb1-2b04-4408-8754-5ec3f25e963c',
        findingId: 'prowler#2',
      });
      expect(org1Assessment1Finding2?.comments).toEqual([]);

      // Validate Org 2 Assessment 1 Findings Comments
      const org2Assessment1Finding1 = await fakeFindingsRepository.get({
        organizationDomain: 'organization2',
        assessmentId: '957b4d8d-3e01-4798-8642-234e38bfefd8',
        findingId: 'prowler#4',
      });
      expect(org2Assessment1Finding1?.comments).toEqual([]);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const adapter = new MigrateDynamoAdapter();
  return {
    adapter,
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeOrganizationRepository: inject(tokenFakeOrganizationRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
