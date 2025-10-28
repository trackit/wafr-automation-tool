import {
  tokenAssessmentsRepository,
  tokenAssessmentsRepositoryDynamoDB,
  tokenFindingsRepository,
  tokenFindingsRepositoryDynamoDB,
  tokenLogger,
  tokenOrganizationRepository,
  tokenOrganizationRepositoryDynamoDB,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { Assessment, Finding, Organization } from '@backend/models';
import { inject } from '@shared/di-container';
import { getBestPracticeCustomId } from '@shared/utils';

export class MigrateDynamoAdapter {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly organizationRepository = inject(tokenOrganizationRepository);
  private readonly assessmentsRepositoryDynamoDB = inject(
    tokenAssessmentsRepositoryDynamoDB,
  );
  private readonly organizationRepositoryDynamoDB = inject(
    tokenOrganizationRepositoryDynamoDB,
  );
  private readonly findingsRepositoryDynamoDB = inject(
    tokenFindingsRepositoryDynamoDB,
  );
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  private async getAssessments(organization: string): Promise<Assessment[]> {
    let nextToken: string | null = null;
    const assessments: Assessment[] = [];
    do {
      const { assessments: fetchedAssessments, nextToken: newNextToken } =
        await this.assessmentsRepositoryDynamoDB.getAll({
          organizationDomain: organization,
          nextToken: nextToken ?? undefined,
        });
      assessments.push(...fetchedAssessments);
      nextToken = newNextToken ?? null;
    } while (nextToken);
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
    const findings = await this.findingsRepositoryDynamoDB.getAll({
      assessmentId,
      organizationDomain: organization,
    });
    return findings.map((finding) => ({
      ...finding,
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
    }));
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
      `Findings for assessment ${assessment.id} migrated successfully`,
    );
    const findingsByBestPractice = new Map<string, Set<string>>();
    for (const finding of findings) {
      for (const bpRelation of finding.bestPracticesRelations) {
        const key = getBestPracticeCustomId({
          pillarId: bpRelation.pillarId,
          questionId: bpRelation.questionId,
          bestPracticeId: bpRelation.bestPracticeId,
        });
        if (!findingsByBestPractice.has(key)) {
          findingsByBestPractice.set(key, new Set());
        }
        findingsByBestPractice.get(key)?.add(finding.id);
      }
    }
    this.logger.info(
      `Linking findings for ${findingsByBestPractice.size} best practices`,
    );
    for (const [key, findingIds] of findingsByBestPractice) {
      this.logger.info(`Linking findings for best practice ${key}`);
      const [pillarId, questionId, bestPracticeId] = key.split('#');
      await this.assessmentsRepository.saveBestPracticeFindings({
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
      `Best practices for assessment ${assessment.id} linked successfully`,
    );
  }

  public async handle(): Promise<void> {
    this.logger.info('Starting migration from DynamoDB to SQL');

    // Create main database
    await this.clientManager.initialize();
    const mainDataSource = await this.clientManager.getClient();
    await mainDataSource.runMigrations();
    this.logger.info('Main database migrations ran successfully');

    // Recreate organizations
    const organizations = await this.organizationRepositoryDynamoDB.getAll();
    this.logger.info(`Found ${organizations.length} organizations to migrate`);
    await Promise.all(
      organizations.map((org) =>
        this.organizationRepository.save({
          ...org,
          name: org.name || org.domain,
        }),
      ),
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

    await this.clientManager.closeConnections();
  }
}
