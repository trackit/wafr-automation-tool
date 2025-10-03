import { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';

import {
  tokenAssessmentsRepository,
  tokenDynamoDBAssessmentTableName,
  tokenDynamoDBDocument,
  tokenDynamoDBOrganizationTableName,
  tokenFindingsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import {
  Assessment,
  AssessmentFileExport,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentStep,
  BestPractice,
  Finding,
  FindingComment,
  FindingRemediation,
  FindingResource,
  Organization,
  Pillar,
  Question,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import {
  tokenCreateOrganizationUseCase,
  tokenRunDatabaseMigrationsUseCase,
} from '@backend/useCases';
import { inject } from '@shared/di-container';

export interface DynamoDBAssessment {
  PK: string;
  SK: string;
  createdAt: string;
  createdBy: string;
  executionArn: string;
  pillars?: Record<string, DynamoDBPillar>;
  graphData?: DynamoDBAssessmentGraphData;
  id: string;
  name: string;
  organization: string;
  questionVersion?: string;
  rawGraphData: Partial<Record<ScanningTool, DynamoDBAssessmentGraphData>>;
  regions: string[];
  exportRegion?: string;
  roleArn: string;
  step: AssessmentStep;
  workflows: string[];
  error?: DynamoDBAssessmentError;
  fileExports?: DynamoDBAssessmentFileExports;
  wafrWorkloadArn?: string;
  opportunityId?: string;
}

export interface DynamoDBAssessmentGraphData {
  findings: number;
  regions: Record<string, number>;
  resourceTypes: Record<string, number>;
  severities: Partial<Record<SeverityType, number>>;
}

export interface DynamoDBAssessmentError {
  cause: string;
  error: string;
}

export interface DynamoDBBestPractice {
  description: string;
  id: string;
  label: string;
  primaryId: string;
  results: Set<string>;
  risk: SeverityType;
  checked: boolean;
}

export interface DynamoDBFinding {
  PK: string;
  SK: string;
  bestPractices: string;
  hidden: boolean;
  id: string;
  isAIAssociated: boolean;
  comments?: Record<string, DynamoDBFindingComment>;
  metadata: {
    eventCode?: string;
  };
  remediation?: FindingRemediation;
  resources?: FindingResource[];
  riskDetails: string;
  severity: SeverityType;
  statusCode: string;
  statusDetail: string;
}

export interface DynamoDBFindingBody {
  hidden?: boolean;
  comments?: Record<string, DynamoDBFindingComment>;
}

export interface DynamoDBFindingComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface DynamoDBPillar {
  disabled: boolean;
  id: string;
  label: string;
  primaryId: string;
  questions: Record<string, DynamoDBQuestion>;
}

export interface DynamoDBQuestion {
  bestPractices: Record<string, DynamoDBBestPractice>;
  disabled: boolean;
  id: string;
  label: string;
  none: boolean;
  primaryId: string;
}

export type DynamoDBAssessmentFileExports = Partial<
  Record<AssessmentFileExportType, Record<string, DynamoDBAssessmentFileExport>>
>;

export interface DynamoDBAssessmentFileExport {
  id: string;
  status: AssessmentFileExportStatus;
  error?: string;
  versionName: string;
  objectKey?: string;
  createdAt: string;
}

export function fromDynamoDBBestPracticeItem(
  item: DynamoDBBestPractice
): BestPractice {
  return {
    description: item.description,
    id: item.id,
    label: item.label,
    primaryId: item.primaryId,
    risk: item.risk,
    checked: item.checked,
  };
}

export function fromDynamoDBQuestionItem(item: DynamoDBQuestion): Question {
  return {
    bestPractices: Object.values(item.bestPractices).map((bestPractice) =>
      fromDynamoDBBestPracticeItem(bestPractice)
    ),
    disabled: item.disabled,
    id: item.id,
    label: item.label,
    none: item.none,
    primaryId: item.primaryId,
  };
}

export function fromDynamoDBPillarItem(item: DynamoDBPillar): Pillar {
  return {
    disabled: item.disabled,
    id: item.id,
    label: item.label,
    primaryId: item.primaryId,
    questions: Object.values(item.questions).map((question) =>
      fromDynamoDBQuestionItem(question)
    ),
  };
}

export function fromDynamoDBFileExportItem(
  item: DynamoDBAssessmentFileExport,
  type: AssessmentFileExportType
): AssessmentFileExport {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    type,
  };
}

export function fromDynamoDBAssessmentItem(
  item: DynamoDBAssessment | undefined
): Assessment | undefined {
  if (!item) return undefined;
  const assessment = item;
  return {
    createdAt: new Date(assessment.createdAt),
    createdBy: assessment.createdBy,
    executionArn: assessment.executionArn,
    ...(assessment.pillars && {
      pillars: Object.values(assessment.pillars).map((pillar) =>
        fromDynamoDBPillarItem(pillar)
      ),
    }),
    id: assessment.id,
    name: assessment.name,
    organization: assessment.organization,
    questionVersion: assessment.questionVersion,
    regions: assessment.regions,
    exportRegion: assessment.exportRegion,
    roleArn: assessment.roleArn,
    workflows: assessment.workflows,
    error: assessment.error,
    fileExports: assessment.fileExports
      ? Object.entries(assessment.fileExports).flatMap(
          ([type, fileExportsByType]) =>
            Object.values(fileExportsByType).map((fileExport) =>
              fromDynamoDBFileExportItem(
                fileExport,
                type as AssessmentFileExportType
              )
            )
        )
      : [],
    finished: assessment.step === AssessmentStep.FINISHED,
  };
}

export function fromDynamoDBFindingComment(
  comment: DynamoDBFindingComment
): FindingComment {
  return {
    id: comment.id,
    authorId: comment.authorId,
    text: comment.text,
    createdAt: new Date(comment.createdAt),
  };
}

export function fromDynamoDBFindingItem(item: DynamoDBFinding): Finding {
  const finding = item;
  return {
    hidden: finding.hidden,
    id: finding.SK,
    isAIAssociated: finding.isAIAssociated,
    eventCode: finding.metadata?.eventCode,
    remediation: finding.remediation,
    resources: finding.resources || [],
    riskDetails: finding.riskDetails,
    severity: finding.severity,
    statusCode: finding.statusCode,
    statusDetail: finding.statusDetail,
    comments: finding.comments
      ? Object.values(finding.comments).map((comment) =>
          fromDynamoDBFindingComment(comment)
        )
      : undefined,
  };
}

export class MigrateDynamoAdapter {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly ddbClient = inject(tokenDynamoDBDocument);
  private readonly organizationsTableName = inject(
    tokenDynamoDBOrganizationTableName
  );
  private readonly assessmentsTableName = inject(
    tokenDynamoDBAssessmentTableName
  );
  private readonly runDatabaseMigrationsUseCase = inject(
    tokenRunDatabaseMigrationsUseCase
  );
  private readonly createOrganizationUseCase = inject(
    tokenCreateOrganizationUseCase
  );
  private readonly logger = inject(tokenLogger);

  private async getOrganizations(): Promise<(Organization & { PK: string })[]> {
    const result = await this.ddbClient.scan({
      TableName: this.organizationsTableName,
      Limit: 1000,
    });
    return result.Items as (Organization & { PK: string })[];
  }

  private async getAssessments(organization: string): Promise<Assessment[]> {
    const assessments: Assessment[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
    do {
      const result: QueryCommandOutput = await this.ddbClient.query({
        TableName: this.assessmentsTableName,
        KeyConditionExpression: `PK = :pk`,
        ExpressionAttributeValues: {
          ':pk': organization,
        },
        Limit: 25,
        ExclusiveStartKey: lastEvaluatedKey,
      });
      assessments.push(
        ...((result.Items || []) as DynamoDBAssessment[])
          .map(fromDynamoDBAssessmentItem)
          .filter((a): a is Assessment => !!a)
      );
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return assessments;
  }

  private async getFindingsByAssessment(args: {
    assessmentId: string;
    organization: string;
  }): Promise<
    (Finding & {
      bestPracticesRelations: {
        bestPracticeId: string;
        questionId: string;
        pillarId: string;
      }[];
    })[]
  > {
    const { assessmentId, organization } = args;

    const findings: (Finding & {
      bestPracticesRelations: {
        bestPracticeId: string;
        questionId: string;
        pillarId: string;
      }[];
    })[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
    do {
      const result = await this.ddbClient.query({
        TableName: this.assessmentsTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `${organization}#${assessmentId}#FINDINGS`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });
      const dynamodbFindings = result.Items as DynamoDBFinding[];
      findings.push(
        ...dynamodbFindings.map((finding) => ({
          ...fromDynamoDBFindingItem(finding),
          bestPracticesRelations: finding.bestPractices
            ? finding.bestPractices
                .trim()
                .split(',')
                .map((bp) => {
                  const [pillarId, questionId, bestPracticeId] = bp
                    .trim()
                    .split('#');
                  return { pillarId, questionId, bestPracticeId };
                })
            : [],
        }))
      );
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return findings;
  }

  private async recreateAssessmentForOrganization(args: {
    assessment: Assessment;
    organization: Organization;
  }): Promise<void> {
    const { assessment, organization } = args;
    await this.assessmentsRepository.save(assessment);
    const findings = await this.getFindingsByAssessment({
      assessmentId: assessment.id,
      organization: organization.domain,
    });
    this.logger.info(`Found ${findings.length} findings to migrate`);
    await this.findingsRepository.saveAll({
      assessmentId: assessment.id,
      organizationDomain: organization.domain,
      findings,
    });
    this.logger.info(
      `Findings for assessment ${assessment.id} migrated successfully`
    );
    const findingsByBestPractice = new Map<string, Set<string>>();
    for (const finding of findings) {
      for (const bpRelation of finding.bestPracticesRelations) {
        const key = `${bpRelation.pillarId}#${bpRelation.questionId}#${bpRelation.bestPracticeId}`;
        if (!findingsByBestPractice.has(key)) {
          findingsByBestPractice.set(key, new Set());
        }
        findingsByBestPractice.get(key)?.add(finding.id);
      }
    }
    this.logger.info(
      `Linking findings for ${findingsByBestPractice.size} best practices`
    );
    for (const [key, findingIds] of findingsByBestPractice) {
      this.logger.info(`Linking findings for best practice ${key}`);
      const [pillarId, questionId, bestPracticeId] = key.split('#');
      await this.findingsRepository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: organization.domain,
        pillarId,
        questionId,
        bestPracticeId,
        bestPracticeFindingIds: findingIds,
      });
      this.logger.info(`Findings for best practice ${key} linked successfully`);
    }
    this.logger.info(
      `Best practices for assessment ${assessment.id} linked successfully`
    );
  }

  public async handle(): Promise<void> {
    this.logger.info('Starting migration from DynamoDB to SQL');

    // Create main database
    await this.runDatabaseMigrationsUseCase.runDatabaseMigrations();
    this.logger.info('Main database migrations ran successfully');

    // Recreate organizations
    const organizations = await this.getOrganizations();
    this.logger.info(`Found ${organizations.length} organizations to migrate`);
    await Promise.all(
      organizations.map(({ PK: _PK, ...org }) =>
        this.createOrganizationUseCase.createOrganization(org)
      )
    );
    this.logger.info('Organizations recreated successfully');

    // Recreate assessments and findings
    for (const organization of organizations) {
      this.logger.info(`Migrating organization ${organization.domain}`);
      const assessments = await this.getAssessments(organization.domain);
      this.logger.info(`Found ${assessments.length} assessments to migrate`);
      for (const assessment of assessments) {
        this.logger.info(`Migrating assessment ${assessment.id}`, {
          assessment,
        });
        await this.recreateAssessmentForOrganization({
          assessment,
          organization,
        });
        this.logger.info(`Assessment ${assessment.id} migrated successfully`);
      }
    }

    this.logger.info('Migration from DynamoDB to SQL completed successfully');
  }
}
