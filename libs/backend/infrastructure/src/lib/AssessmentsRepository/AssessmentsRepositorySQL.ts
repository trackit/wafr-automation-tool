import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import type {
  Assessment,
  AssessmentBody,
  AssessmentGraphData,
  BestPractice,
  BestPracticeBody,
  Finding,
  FindingBody,
  FindingComment,
  FindingCommentBody,
  Pillar,
  PillarBody,
  Question,
  QuestionBody,
  ScanningTool,
} from '@backend/models';
import {
  AssessmentsRepository,
  AssessmentsRepositoryGetBestPracticeFindingsArgs,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  EmptyUpdateBodyError,
  FindingNotFoundError,
  InvalidNextTokenError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../Errors';
import {
  AssessmentEntity,
  BestPracticeEntity,
  FindingCommentEntity,
  FindingEntity,
  PillarEntity,
  QuestionEntity,
} from '../config/typeorm';
import { tokenLogger } from '../Logger';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';

export class AssessmentsRepositorySQL implements AssessmentsRepository {
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  private async repo<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    organization: string
  ): Promise<Repository<T>> {
    const dataSource = await this.clientManager.getClient(organization);
    return dataSource.getRepository(entity);
  }

  public static encodeNextToken(
    next?: Record<string, unknown>
  ): string | undefined {
    if (!next) return undefined;
    return Buffer.from(JSON.stringify(next)).toString('base64');
  }

  public static decodeNextToken(
    nextToken?: string
  ): Record<string, unknown> | undefined {
    if (!nextToken) return undefined;
    try {
      return JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));
    } catch {
      throw new InvalidNextTokenError();
    }
  }

  private toDomainBestPractice(e: BestPracticeEntity): BestPractice {
    return {
      id: e.id,
      description: e.description,
      label: e.label,
      primaryId: e.primaryId,
      results: e.results ?? new Set<string>(),
      risk: e.risk,
      checked: e.checked,
    };
  }

  private toDomainQuestion(e: QuestionEntity): Question {
    return {
      id: e.id,
      disabled: e.disabled,
      label: e.label,
      none: e.none,
      primaryId: e.primaryId,
      bestPractices: (e.bestPractices ?? []).map((bp) =>
        this.toDomainBestPractice(bp)
      ),
    };
  }

  private toDomainPillar(e: PillarEntity): Pillar {
    return {
      id: e.id,
      disabled: e.disabled,
      label: e.label,
      primaryId: e.primaryId,
      questions: (e.questions ?? []).map((q) => this.toDomainQuestion(q)),
    };
  }

  private toDomainAssessment(
    e: AssessmentEntity,
    organization: string
  ): Assessment {
    return {
      id: e.id,
      organization,
      createdBy: e.createdBy,
      executionArn: e.executionArn,
      createdAt: e.createdAt,
      graphData: e.graphData,
      name: e.name,
      questionVersion: e.questionVersion,
      rawGraphData: e.rawGraphData ?? {},
      regions: e.regions ?? [],
      exportRegion: e.exportRegion ?? undefined,
      roleArn: e.roleArn,
      step: e.step,
      workflows: e.workflows ?? [],
      error: e.error ?? undefined,
      pillars: (e.pillars ?? []).map((p) => this.toDomainPillar(p)),
    };
  }

  private toDomainFindingComment(e: FindingCommentEntity): FindingComment {
    return {
      id: e.id,
      authorId: e.authorId,
      text: e.text,
      createdAt: e.createdAt,
    };
  }

  private toDomainFinding(e: FindingEntity): Finding {
    return {
      id: e.id,
      hidden: e.hidden,
      isAIAssociated: e.isAIAssociated,
      bestPractices: e.bestPractices,
      metadata: e.metadata,
      remediation: e.remediation,
      resources: e.resources,
      riskDetails: e.riskDetails,
      severity: e.severity,
      statusCode: e.statusCode,
      statusDetail: e.statusDetail,
      comments: (e.comments ?? []).map((c) => this.toDomainFindingComment(c)),
    };
  }

  public async save(assessment: Assessment): Promise<void> {
    const repo = await this.repo(AssessmentEntity, assessment.organization);

    const entity = repo.create(assessment);
    try {
      await repo.save(entity);
      this.logger.info(`Assessment saved: ${assessment.id}`);
    } catch (error) {
      this.logger.error(`Failed to save assessment: ${error}`, assessment);
      throw error;
    }
  }

  public async saveFinding(args: {
    assessmentId: string;
    organization: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organization, finding } = args;
    const repo = await this.repo(FindingEntity, organization);

    const entity = repo.create({
      ...finding,
      assessmentId,
      comments: finding.comments,
    });

    try {
      await repo.save(entity);
      this.logger.info(
        `Finding saved: ${finding.id} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to save finding: ${error}`, args);
      throw error;
    }
  }

  public async getAll(args: {
    organization: string;
    limit?: number;
    search?: string;
    nextToken?: string;
  }): Promise<{ assessments: Assessment[]; nextToken?: string }> {
    const { organization, limit = 20, search, nextToken } = args;
    const repo = await this.repo(AssessmentEntity, organization);

    const decoded = AssessmentsRepositorySQL.decodeNextToken(nextToken) as
      | { offset?: number }
      | undefined;
    const offset = decoded?.offset ?? 0;

    const qb = repo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (search && search.trim()) {
      qb.andWhere(
        '(a.name ILIKE :term OR a.roleArn ILIKE :term OR a.id::text ILIKE :term)',
        { term: `%${search}%` }
      );
    }

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.toDomainAssessment(e, organization));

    const nextOffset = offset + items.length;
    const nextTk =
      nextOffset < total
        ? AssessmentsRepositorySQL.encodeNextToken({ offset: nextOffset })
        : undefined;

    return { assessments: items, nextToken: nextTk };
  }

  public async get(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organization } = args;
    const repo = await this.repo(AssessmentEntity, organization);
    const entity = await repo.findOne({
      where: { id: assessmentId },
      relations: { pillars: { questions: { bestPractices: true } } },
    });
    return entity ? this.toDomainAssessment(entity, organization) : undefined;
  }

  public async getFinding(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, organization, findingId } = args;
    const repo = await this.repo(FindingEntity, organization);
    const entity = await repo.findOne({
      where: { id: findingId, assessmentId },
      relations: { comments: true },
    });
    return entity ? this.toDomainFinding(entity) : undefined;
  }

  private async loadAssessmentOrThrow(
    assessmentId: string,
    organization: string
  ): Promise<AssessmentEntity> {
    const assessment = await this.get({ assessmentId, organization });
    if (!assessment) {
      this.logger.error(
        `Attempted operation on non-existing assessment ${assessmentId} in organization ${organization}`
      );
      throw new AssessmentNotFoundError({ assessmentId, organization });
    }
    return assessment as AssessmentEntity;
  }

  public async getBestPracticeFindings(
    args: AssessmentsRepositoryGetBestPracticeFindingsArgs
  ): Promise<{ findings: Finding[]; nextToken?: string }> {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      limit = 100,
      searchTerm = '',
      showHidden = false,
      nextToken,
    } = args;

    await this.loadAssessmentOrThrow(assessmentId, organization);
    const assessmentWithPillars = await this.get({
      assessmentId,
      organization,
    });
    this.assertBestPracticeExists({
      assessment: assessmentWithPillars as Assessment,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
    });

    const repo = await this.repo(FindingEntity, organization);
    const decoded = AssessmentsRepositorySQL.decodeNextToken(nextToken) as
      | { offset?: number }
      | undefined;
    const offset = decoded?.offset ?? 0;

    const customId = `${pillarId}#${questionId}#${bestPracticeId}`;

    const qb = repo
      .createQueryBuilder('f')
      .where('f.assessmentId = :assessmentId', { assessmentId })
      .andWhere('f.bestPractices LIKE :bp', { bp: `%${customId}%` })
      .orderBy('f.id', 'ASC')
      .skip(offset)
      .take(limit);

    if (!showHidden) qb.andWhere('f.hidden = :hidden', { hidden: false });
    if (searchTerm && searchTerm.trim()) {
      qb.andWhere('(f.riskDetails ILIKE :term OR f.statusDetail ILIKE :term)', {
        term: `%${searchTerm}%`,
      });
    }

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.toDomainFinding(e));

    const nextOffset = offset + items.length;
    const nextTk =
      nextOffset < total
        ? AssessmentsRepositorySQL.encodeNextToken({ offset: nextOffset })
        : undefined;

    return { findings: items, nextToken: nextTk };
  }

  public async addFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    comment: FindingComment;
  }): Promise<void> {
    const { assessmentId, organization, findingId, comment } = args;
    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({ assessmentId, organization, findingId });
    }

    const commentsRepo = await this.repo(FindingCommentEntity, organization);
    const entity = commentsRepo.create({
      ...comment,
      findingId: findingId,
      assessmentId,
    });
    try {
      await commentsRepo.save(entity);
      this.logger.info(
        `Comment added to finding: ${findingId} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to add comment to finding: ${error}`, args);
      throw error;
    }
  }

  public assertBestPracticeExists(args: {
    assessment: Assessment;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
  }): void {
    const { assessment, pillarId, questionId, bestPracticeId } = args;
    const pillar = assessment.pillars?.find(
      (p) => p.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
      });
    }
    const question = pillar.questions.find(
      (q) => q.id === questionId.toString()
    );
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
        questionId,
      });
    }
    const bestPractice = question.bestPractices.find(
      (bp) => bp.id === bestPracticeId.toString()
    );
    if (!bestPractice) {
      throw new BestPracticeNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }
  }

  public async updateBestPractice(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeBody: BestPracticeBody;
  }): Promise<void> {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeBody,
    } = args;

    await this.loadAssessmentOrThrow(assessmentId, organization);

    if (Object.keys(bestPracticeBody).length === 0) {
      this.logger.error(
        `Nothing to update for best practice: ${assessmentId}#${pillarId}#${questionId}#${bestPracticeId}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for best practice: ${assessmentId}#${pillarId}#${questionId}#${bestPracticeId}`
      );
    }

    const repo = await this.repo(BestPracticeEntity, organization);
    const bp = await repo.findOne({
      where: { id: bestPracticeId, questionId, pillarId, assessmentId },
    });
    if (!bp) {
      this.logger.error(
        `Best practice not found: ${assessmentId}#${pillarId}#${questionId}#${bestPracticeId}`
      );
      throw new BestPracticeNotFoundError({
        assessmentId,
        organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }

    if (typeof bestPracticeBody.checked === 'boolean') {
      bp.checked = bestPracticeBody.checked;
    }

    await repo.save(bp);
  }

  public async addBestPracticeFindings(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    bestPracticeId: string;
    bestPracticeFindingIds: Set<string>;
  }): Promise<void> {
    const {
      assessmentId,
      organization,
      pillarId,
      questionId,
      bestPracticeId,
      bestPracticeFindingIds,
    } = args;

    await this.loadAssessmentOrThrow(assessmentId, organization);

    const repo = await this.repo(BestPracticeEntity, organization);
    const bp = await repo.findOne({
      where: { id: bestPracticeId, questionId, pillarId, assessmentId },
    });
    if (!bp) {
      this.logger.error(
        `Best practice not found when adding results: ${assessmentId}#${pillarId}#${questionId}#${bestPracticeId}`
      );
      throw new BestPracticeNotFoundError({
        assessmentId,
        organization,
        pillarId,
        questionId,
        bestPracticeId,
      });
    }

    const existing = bp.results ?? new Set<string>();
    for (const id of bestPracticeFindingIds) existing.add(id);
    bp.results = existing;

    await repo.save(bp);
  }

  public assertPillarExists(args: {
    assessment: Assessment;
    pillarId: string;
  }): void {
    const { assessment, pillarId } = args;
    const pillar = assessment.pillars?.find(
      (p) => p.id === pillarId.toString()
    );
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
      });
    }
  }

  public async updatePillar(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    pillarBody: PillarBody;
  }): Promise<void> {
    const { assessmentId, organization, pillarId, pillarBody } = args;

    const assessment: Assessment = {
      ...(await this.loadAssessmentOrThrow(assessmentId, organization)),
      organization,
    };

    this.assertPillarExists({ assessment, pillarId });

    if (Object.keys(pillarBody).length === 0) {
      this.logger.error(
        `Nothing to update for pillar: ${assessmentId}#${pillarId}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for pillar: ${assessmentId}#${pillarId}`
      );
    }

    const repo = await this.repo(PillarEntity, organization);
    const pillar = await repo.findOne({
      where: { id: pillarId, assessmentId },
    });
    if (!pillar)
      throw new PillarNotFoundError({ assessmentId, organization, pillarId });

    if (typeof pillarBody.disabled === 'boolean')
      pillar.disabled = pillarBody.disabled;

    await repo.save(pillar);
  }

  public async delete(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;

    await this.loadAssessmentOrThrow(assessmentId, organization);

    const repo = await this.repo(AssessmentEntity, organization);
    try {
      await repo.delete({ id: assessmentId });
      this.logger.info(`Assessment deleted: ${assessmentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete assessment: ${error}`, args);
      throw error;
    }
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;

    await this.loadAssessmentOrThrow(assessmentId, organization);

    const repo = await this.repo(FindingEntity, organization);
    try {
      await repo.delete({ assessmentId });
      this.logger.info(`Findings deleted for assessment: ${assessmentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete findings: ${error}`, args);
      throw error;
    }
  }

  public async deleteFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    commentId: string;
  }): Promise<void> {
    const { assessmentId, organization, findingId, commentId } = args;

    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({ assessmentId, organization, findingId });
    }

    const repo = await this.repo(FindingCommentEntity, organization);
    try {
      await repo.delete({ id: commentId, findingId: finding.id });
      this.logger.info(
        `Finding comment deleted: ${finding.id} for assessment: ${assessmentId}`
      );
    } catch (error) {
      this.logger.error(`Failed to delete finding comment: ${error}`, args);
      throw error;
    }
  }

  public async update(args: {
    assessmentId: string;
    organization: string;
    assessmentBody: AssessmentBody;
  }): Promise<void> {
    const { assessmentId, organization, assessmentBody } = args;

    await this.loadAssessmentOrThrow(assessmentId, organization);

    if (Object.keys(assessmentBody).length === 0) {
      this.logger.error(
        `Nothing to update for assessment ${assessmentId} for organization ${organization}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for assessment ${assessmentId} for organization ${organization}`
      );
    }

    const repo = await this.repo(AssessmentEntity, organization);
    const entity = await repo.findOne({
      where: { id: assessmentId },
      relations: { pillars: { questions: { bestPractices: true } } },
    });
    if (!entity)
      throw new AssessmentNotFoundError({ assessmentId, organization });

    if (assessmentBody.name !== undefined) entity.name = assessmentBody.name;
    if (assessmentBody.graphData !== undefined)
      entity.graphData = assessmentBody.graphData;
    if (assessmentBody.error !== undefined) entity.error = assessmentBody.error;
    if (assessmentBody.step !== undefined) entity.step = assessmentBody.step;
    if (assessmentBody.rawGraphData !== undefined)
      entity.rawGraphData = assessmentBody.rawGraphData;
    if (assessmentBody.questionVersion !== undefined)
      entity.questionVersion = assessmentBody.questionVersion;
    if (assessmentBody.exportRegion !== undefined)
      entity.exportRegion = assessmentBody.exportRegion;

    if (assessmentBody.pillars !== undefined) {
      entity.pillars = assessmentBody.pillars as PillarEntity[];
    }

    await repo.save(entity);
    this.logger.info(`Assessment updated: ${assessmentId}`);
  }

  public async updateFinding(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    findingBody: FindingBody;
  }): Promise<void> {
    const { assessmentId, organization, findingId, findingBody } = args;

    const repo = await this.repo(FindingEntity, organization);
    const entity = await repo.findOne({
      where: { id: findingId, assessmentId },
    });
    if (!entity) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({ assessmentId, organization, findingId });
    }

    if (Object.keys(findingBody).length === 0) {
      this.logger.error(
        `Nothing to update for finding ${findingId} in assessment ${assessmentId}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for finding ${findingId} in assessment ${assessmentId}`
      );
    }

    if (typeof findingBody.hidden === 'boolean')
      entity.hidden = findingBody.hidden;
    if (findingBody.comments !== undefined) {
      const commentsRepo = await this.repo(FindingCommentEntity, organization);
      await commentsRepo.delete({ findingId: entity.id });
      const replacements = (findingBody.comments as FindingComment[]).map((c) =>
        commentsRepo.create({ ...c, findingId: entity.id })
      );
      await commentsRepo.save(replacements);
      entity.comments = replacements;
    }

    await repo.save(entity);
    this.logger.info(
      `Finding updated: ${findingId} for assessment: ${assessmentId}`
    );
  }

  public async updateFindingComment(args: {
    assessmentId: string;
    organization: string;
    findingId: string;
    commentId: string;
    commentBody: FindingCommentBody;
  }): Promise<void> {
    const { assessmentId, organization, findingId, commentId, commentBody } =
      args;

    const finding = await this.getFinding({
      assessmentId,
      organization,
      findingId,
    });
    if (!finding) {
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organization}`
      );
      throw new FindingNotFoundError({ assessmentId, organization, findingId });
    }

    const repo = await this.repo(FindingCommentEntity, organization);
    const entity = await repo.findOne({ where: { id: commentId, findingId } });
    if (!entity) {
      this.logger.error(
        `Comment ${commentId} not found in finding ${findingId}`
      );
      throw new Error(`Comment ${commentId} not found`);
    }

    if (commentBody.text !== undefined) entity.text = commentBody.text;

    await repo.save(entity);
    this.logger.info(
      `Comment ${commentId} in finding ${findingId} for assessment ${assessmentId} updated successfully`
    );
  }

  private assertQuestionExists(args: {
    assessment: Assessment;
    organization: string;
    pillarId: string;
    questionId: string;
  }): void {
    const { assessment, pillarId, questionId } = args;
    const pillar = assessment.pillars?.find((p) => p.id === pillarId);
    if (!pillar) {
      throw new PillarNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
      });
    }
    const question = pillar.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new QuestionNotFoundError({
        assessmentId: assessment.id,
        organization: assessment.organization,
        pillarId,
        questionId,
      });
    }
  }

  public async updateQuestion(args: {
    assessmentId: string;
    organization: string;
    pillarId: string;
    questionId: string;
    questionBody: QuestionBody;
  }): Promise<void> {
    const { assessmentId, organization, pillarId, questionId, questionBody } =
      args;

    const assessment: Assessment = {
      ...(await this.loadAssessmentOrThrow(assessmentId, organization)),
      organization,
    };
    this.assertQuestionExists({
      assessment,
      organization,
      pillarId,
      questionId,
    });

    if (Object.keys(questionBody).length === 0) {
      this.logger.error(
        `Nothing to update for question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organization ${organization}`
      );
      throw new EmptyUpdateBodyError(
        `Nothing to update for question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organization ${organization}`
      );
    }

    const repo = await this.repo(QuestionEntity, organization);
    const question = await repo.findOne({
      where: { id: questionId, pillarId, assessmentId },
    });
    if (!question)
      throw new QuestionNotFoundError({
        assessmentId,
        organization,
        pillarId,
        questionId,
      });

    if (typeof questionBody.disabled === 'boolean')
      question.disabled = questionBody.disabled;
    if (typeof questionBody.none === 'boolean')
      question.none = questionBody.none;

    await repo.save(question);
    this.logger.info(
      `Question ${questionId} in pillar ${pillarId} in assessment ${assessmentId} for organization ${organization} updated successfully`
    );
  }

  public async updateRawGraphDataForScanningTool(args: {
    assessmentId: string;
    organization: string;
    scanningTool: ScanningTool;
    graphData: AssessmentGraphData;
  }): Promise<void> {
    const { assessmentId, organization, scanningTool, graphData } = args;

    const repo = await this.repo(AssessmentEntity, organization);
    const entity = await repo.findOne({
      where: { id: assessmentId },
    });
    if (!entity)
      throw new AssessmentNotFoundError({ assessmentId, organization });

    const raw = (entity.rawGraphData ?? {}) as Partial<
      Record<ScanningTool, AssessmentGraphData>
    >;
    raw[scanningTool] = graphData;
    entity.rawGraphData = raw;

    await repo.save(entity);
    this.logger.info(
      `Raw graph data for scanning tool ${scanningTool} updated successfully for assessment ${assessmentId}`
    );
  }
}

export const tokenAssessmentsRepository =
  createInjectionToken<AssessmentsRepository>('AssessmentsRepository', {
    useClass: AssessmentsRepositorySQL,
  });
