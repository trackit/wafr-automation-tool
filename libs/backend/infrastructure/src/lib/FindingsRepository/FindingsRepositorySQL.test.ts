import {
  AssessmentMother,
  AssessmentVersionMother,
  BestPracticeMother,
  FindingCommentMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentsRepositorySQL } from '../infrastructure';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { startPostgresContainer } from '../testUtils';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import { GetBestPracticeFindingsAssessmentsRepositoryArgsMother } from './FindingsRepositoryGetBestPracticeFindingsArgsMother';
import { FindingsRepositorySQL } from './FindingsRepositorySQL';

let pgContainer: Awaited<ReturnType<typeof startPostgresContainer>>;

beforeAll(async () => {
  reset();
  pgContainer = await startPostgresContainer();
  registerTestInfrastructure();

  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
  await clientManager.createClient('organization1');
  await clientManager.createClient('organization2');
}, 30000);

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
});

afterAll(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.closeConnections();
  await pgContainer.stop();
});

describe('FindingsRepositorySQL', () => {
  describe('save', () => {
    it('should save a finding by scanningTool for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withHidden(false)
        .withIsAIAssociated(false)
        .withEventCode('event1')
        .withRemediation({
          desc: 'Remediation description',
          references: ['ref1', 'ref2'],
        })
        .withResources([
          {
            name: 'resource1',
            type: 'AWS::EC2::Instance',
            uid: 'resource-id-1',
            region: 'us-west-2',
          },
        ])
        .withRiskDetails('Risk details for finding 1')
        .withSeverity(SeverityType.High)
        .withStatusCode('status-code-1')
        .withStatusDetail('Status detail for finding 1')
        .withVersion(2)
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      const savedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
      });

      expect(savedFinding).toEqual(finding);
    });
  });

  describe('saveAll', () => {
    it('should save multiple findings by scanningTool for an assessment by ID and organization', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding = FindingMother.basic()
        .withId('scanningTool#0')
        .withVersion(assessment.latestVersionNumber)
        .withHidden(false)
        .withIsAIAssociated(false)
        .withEventCode('event1')
        .withRemediation({
          desc: 'Remediation description',
          references: ['ref1', 'ref2'],
        })
        .withResources([
          {
            name: 'resource1',
            type: 'AWS::EC2::Instance',
            uid: 'resource-id-1',
            region: 'us-west-2',
          },
        ])
        .withRiskDetails('Risk details for finding 1')
        .withSeverity(SeverityType.High)
        .withStatusCode('status-code-1')
        .withStatusDetail('Status detail for finding 1')
        .build();
      const finding2 = FindingMother.basic()
        .withId('scanningTool#1')
        .withVersion(assessment.latestVersionNumber)
        .withHidden(false)
        .withIsAIAssociated(false)
        .withEventCode('event1')
        .withRemediation({
          desc: 'Remediation description',
          references: ['ref1', 'ref2'],
        })
        .withResources([
          {
            name: 'resource1',
            type: 'AWS::EC2::Instance',
            uid: 'resource-id-1',
            region: 'us-west-2',
          },
        ])
        .withRiskDetails('Risk details for finding 1')
        .withSeverity(SeverityType.High)
        .withStatusCode('status-code-1')
        .withStatusDetail('Status detail for finding 1')
        .build();
      await repository.saveAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        findings: [finding, finding2],
      });

      const savedFindings = await repository.getAll({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: finding.version,
      });

      expect(savedFindings).toEqual([finding, finding2]);
    });
  });

  describe('saveComment', () => {
    it('should add a comment to a finding', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic().withComments([]).build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      const comment = FindingCommentMother.basic().build();

      await repository.saveComment({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
        comment,
      });

      const findingWithComment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
      });

      expect(findingWithComment).toEqual(
        expect.objectContaining({
          comments: [comment],
        }),
      );
    });
  });

  describe('get', () => {
    it('should get finding for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic().build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      const fetchedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
      });

      expect(fetchedFinding).toEqual(finding);
    });

    it('should return undefined if finding does not exist', async () => {
      const { repository } = setup();

      const fetchedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: 'scanningTool#1',
        version: 1,
      });

      expect(fetchedFinding).toBeUndefined();
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic().withId('scanningTool#1').build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.save({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
        finding: finding2,
      });

      const fetchedFinding1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding1.id,
        version: finding1.version,
      });
      const fetchedFinding2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding2.id,
        version: finding2.version,
      });

      expect(fetchedFinding1).toEqual(finding1);
      expect(fetchedFinding2).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all findings', async () => {
      const { repository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const organizationDomain = 'organization1';

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withVersion(1)
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withVersion(1)
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding2,
      });

      const findings = await repository.getAll({
        assessmentId,
        organizationDomain,
        version: 1,
      });
      expect(findings).toEqual([finding1, finding2]);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withVersion(1)
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: 'organization1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withVersion(1)
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: 'organization2',
        finding: finding2,
      });

      const findings = await repository.getAll({
        assessmentId,
        organizationDomain: 'organization1',
        version: 1,
      });
      expect(findings).toEqual([finding1]);
    });

    it('should return an empty array if no findings exist', async () => {
      const { repository } = setup();

      const findings = await repository.getAll({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        version: 0,
      });
      expect(findings).toEqual([]);
    });
  });

  describe('getBestPracticeFindings', () => {
    it('should return all findings', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .build(),
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: finding1.id }),
        expect.objectContaining({ id: finding2.id }),
      ]);
    });

    it('should be scoped by organization', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const bestPractice2 = BestPracticeMother.basic().withId('bp1').build();
      const question2 = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice2])
        .build();
      const pillar2 = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question2])
        .build();
      const assessment2 = AssessmentMother.basic()
        .withOrganization('organization2')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .withPillars([pillar2])
        .build();
      await assessmentRepository.save(assessment2);
      await assessmentRepository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });
      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice2])
        .withVersion(assessment2.latestVersionNumber)
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: assessment2.id,
        organizationDomain: assessment2.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id]),
      });
      finding1.bestPractices = [bestPractice];

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .build(),
      );

      expect(findings).toEqual([finding1]);
    });

    it('should return an empty array if no findings exist', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .build(),
      );

      expect(findings).toEqual([]);
    });

    it('should not return the hidden findings', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withId('tool#1')
        .withVersion(assessment.latestVersionNumber)
        .withHidden(false)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withId('tool#2')
        .withVersion(assessment.latestVersionNumber)
        .withHidden(true)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .build(),
      );

      expect(findings).toEqual([finding1]);
    });

    it('should only return the matching findings', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withId('tool#1')
        .withVersion(assessment.latestVersionNumber)
        .withRiskDetails('dummy risk details')
        .withStatusDetail('dummy status detail')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withId('tool#2')
        .withVersion(assessment.latestVersionNumber)
        .withStatusDetail('searchterm')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      const finding3 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withId('tool#3')
        .withVersion(assessment.latestVersionNumber)
        .withRiskDetails('searchtermincludedinstring')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding3,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([
          finding1.id,
          finding2.id,
          finding3.id,
        ]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];
      finding3.bestPractices = [bestPractice];

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .withSearchTerm('searchterm')
          .build(),
      );

      expect(findings).toEqual([finding2, finding3]);
    });

    it('should only return a limited number of findings', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      const finding3 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#3')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding3,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([
          finding1.id,
          finding2.id,
          finding3.id,
        ]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];
      finding3.bestPractices = [bestPractice];

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .withLimit(2)
          .build(),
      );

      expect(findings).toEqual([finding1, finding2]);
    });

    it('should also return the hidden findings', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#1')
        .withHidden(false)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#2')
        .withHidden(true)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .withShowHidden(true)
          .build(),
      );

      expect(findings).toEqual([finding1, finding2]);
    });

    it('should return a nextToken if more results are available', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const { nextToken } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId(assessment.id)
          .withOrganizationDomain(assessment.organization)
          .withVersion(assessment.latestVersionNumber)
          .withPillarId(pillar.id)
          .withQuestionId(question.id)
          .withBestPracticeId(bestPractice.id)
          .withLimit(1)
          .build(),
      );
      expect(nextToken).toBeDefined();
    });

    it('should return more results using nextToken', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('bp1').build();
      const question = QuestionMother.basic()
        .withId('question1')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('pillar1')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const { findings: firstFindings, nextToken } =
        await repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId(assessment.id)
            .withOrganizationDomain(assessment.organization)
            .withVersion(assessment.latestVersionNumber)
            .withPillarId(pillar.id)
            .withQuestionId(question.id)
            .withBestPracticeId(bestPractice.id)
            .withLimit(1)
            .build(),
        );
      const { findings: secondFindings } =
        await repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId(assessment.id)
            .withOrganizationDomain(assessment.organization)
            .withVersion(assessment.latestVersionNumber)
            .withPillarId(pillar.id)
            .withQuestionId(question.id)
            .withBestPracticeId(bestPractice.id)
            .withNextToken(nextToken as string)
            .build(),
        );

      expect(firstFindings).not.toEqual(secondFindings);
      expect(firstFindings.length).toBe(1);
      expect(secondFindings.length).toBe(1);
    });
  });

  describe('deleteAll', () => {
    it('should delete findings for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic().withId('scanningTool#1').build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });

      await repository.deleteAll({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      const fetchedFinding1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#1',
        organizationDomain: 'organization1',
        version: finding1.version,
      });
      const fetchedFinding2 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#2',
        organizationDomain: 'organization1',
        version: finding2.version,
      });

      expect(fetchedFinding1).toBeUndefined();
      expect(fetchedFinding2).toBeUndefined();
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic().withId('scanningTool#1').build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.save({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
        finding: finding2,
      });

      await repository.deleteAll({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      const fetchedFinding1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#1',
        organizationDomain: 'organization1',
        version: finding1.version,
      });
      const fetchedFinding2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#2',
        organizationDomain: 'organization2',
        version: finding2.version,
      });

      expect(fetchedFinding1).toBeUndefined();
      expect(fetchedFinding2).toEqual(finding2);
    });

    it('should delete findings only for the specified version', async () => {
      const { repository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const organizationDomain = 'organization1';

      const findingV1 = FindingMother.basic()
        .withId('scanningTool#1')
        .withVersion(1)
        .build();

      const findingV2 = FindingMother.basic()
        .withId('scanningTool#1')
        .withVersion(2)
        .build();

      await repository.save({
        assessmentId,
        organizationDomain,
        finding: findingV1,
      });
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: findingV2,
      });

      await repository.deleteAll({
        assessmentId,
        organizationDomain,
        version: 1,
      });

      const fetchedV1 = await repository.get({
        assessmentId,
        organizationDomain,
        findingId: findingV1.id,
        version: 1,
      });

      const fetchedV2 = await repository.get({
        assessmentId,
        organizationDomain,
        findingId: findingV2.id,
        version: 2,
      });

      expect(fetchedV1).toBeUndefined();
      expect(fetchedV2).toEqual(findingV2);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment from a finding', async () => {
      const { repository } = setup();

      const comment = FindingCommentMother.basic().build();
      const finding = FindingMother.basic()
        .withId('scanningTool#12345')
        .withComments([comment])
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      await repository.deleteComment({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        commentId: comment.id,
        version: finding.version,
      });

      const findingWithComment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
      });

      expect(findingWithComment).toEqual(
        expect.objectContaining({
          comments: [],
        }),
      );
    });
  });

  describe('update', () => {
    it('should update the finding visibility', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic().withHidden(false).build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      await repository.update({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        findingBody: {
          hidden: true,
        },
        version: finding.version,
      });

      const fetchedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
      });

      expect(fetchedFinding).toEqual(
        expect.objectContaining({
          id: finding.id,
          hidden: true,
        }),
      );
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withHidden(false)
        .build();
      const finding2 = FindingMother.basic()
        .withId('tool#1')
        .withHidden(false)
        .build();

      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
        finding: finding2,
      });

      await repository.update({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding1.id,
        findingBody: {
          hidden: true,
        },
        version: finding1.version,
      });

      const updatedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding1.id,
        version: finding1.version,
      });
      const otherFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
        findingId: finding2.id,
        version: finding2.version,
      });

      expect(updatedFinding).toEqual(expect.objectContaining({ hidden: true }));
      expect(otherFinding).toEqual(expect.objectContaining({ hidden: false }));
    });
  });

  describe('updateComment', () => {
    it('should update a comment in a finding', async () => {
      const { repository } = setup();

      const comment = FindingCommentMother.basic()
        .withText('old-comment-text')
        .build();
      const finding = FindingMother.basic().withComments([comment]).build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      await repository.updateComment({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        commentId: comment.id,
        commentBody: {
          text: 'new-comment-text',
        },
        version: finding.version,
      });

      const findingWithComment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        version: finding.version,
      });

      expect(findingWithComment).toEqual(
        expect.objectContaining({
          comments: [
            expect.objectContaining({
              id: comment.id,
              text: 'new-comment-text',
            }),
          ],
        }),
      );
    });
  });

  describe('saveBestPracticeFindings', () => {
    it('should add findings to a best practice', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding = FindingMother.basic()
        .withId('scanningTool#1')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding.id]),
      });
      finding.bestPractices = [bestPractice];

      const findings = await repository.getBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
      });
      expect(findings.findings).toEqual([finding]);
    });

    it('should add several findings to a best practice', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('scanningTool#1')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('scanningTool#2')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const findings = await repository.getBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
      });
      expect(findings.findings).toEqual([finding1, finding2]);
    });

    it('should be able to add findings several times', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('scanningTool#1')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('scanningTool#2')
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id]),
      });
      finding1.bestPractices = [bestPractice];
      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding2.id]),
      });
      finding2.bestPractices = [bestPractice];

      const bestPracticefindings = await repository.getBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
      });
      expect(bestPracticefindings.findings).toEqual([finding1, finding2]);
    });
  });

  describe('countBestPracticeFindings', () => {
    it('should return the number of findings for a best practice', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withBestPractices([bestPractice])
        .withVersion(assessment.latestVersionNumber)
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        finding: finding2,
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set([finding1.id, finding2.id]),
      });
      finding1.bestPractices = [bestPractice];
      finding2.bestPractices = [bestPractice];

      const count = await repository.countBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
      });

      expect(count).toBe(2);
    });

    it('should return 0 if no findings exist', async () => {
      const { repository, assessmentRepository } = setup();

      const bestPractice = BestPracticeMother.basic().build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const count = await repository.countBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
      });

      expect(count).toBe(0);
    });
  });

  describe('aggregateAll', () => {
    it('should aggregates counts for severity and resource regions', async () => {
      const { repository, assessmentRepository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const organizationDomain = 'organization1';

      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization(organizationDomain)
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withBestPractices('0#0#0')
        .withSeverity(SeverityType.High)
        .withResources([
          {
            name: 'resource-1',
            type: 'AWS::S3::Bucket',
            uid: 'resource-uid-1',
            region: 'us-east-1',
          },
          {
            name: 'resource-2',
            type: 'AWS::EC2::Instance1',
            uid: 'resource-uid-2',
            region: 'us-east-2',
          },
        ])
        .build();

      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withBestPractices('0#0#0')
        .withSeverity(SeverityType.Medium)
        .withResources([
          {
            name: 'resource-3',
            type: 'AWS::S3::Bucket',
            uid: 'resource-uid-3',
            region: 'us-east-1',
          },
        ])
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding2,
      });

      const finding3 = FindingMother.basic()
        .withId('tool#3')
        .withBestPractices('0#0#0')
        .withSeverity(SeverityType.Medium)
        .withResources([])
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding3,
      });

      const result = await repository.aggregateAll({
        assessmentId,
        organizationDomain,
        version: assessment.latestVersionNumber,
        fields: {
          severity: true,
          resources: {
            region: true,
          },
        },
      });

      expect(result).toEqual({
        severity: {
          High: 1,
          Medium: 2,
        },
        resources: {
          region: {
            'us-east-1': 2,
            'us-east-2': 1,
          },
        },
      });
    });

    it('shoud be scoped by organization', async () => {
      const { repository, assessmentRepository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const organizationDomain = 'organization1';
      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization(organizationDomain)
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withBestPractices('0#0#0')
        .withSeverity(SeverityType.High)
        .withResources([
          {
            name: 'resource-1',
            type: 'AWS::S3::Bucket',
            uid: 'resource-uid-1',
            region: 'us-east-1',
          },
          {
            name: 'resource-2',
            type: 'AWS::EC2::Instance1',
            uid: 'resource-uid-2',
            region: 'us-east-2',
          },
        ])
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: organizationDomain,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withBestPractices('0#0#0')
        .withSeverity(SeverityType.Medium)
        .withResources([
          {
            name: 'resource-3',
            type: 'AWS::S3::Bucket',
            uid: 'resource-uid-3',
            region: 'us-east-1',
          },
        ])
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: organizationDomain,
        finding: finding2,
      });

      const finding3 = FindingMother.basic()
        .withId('tool#3')
        .withBestPractices('')
        .withSeverity(SeverityType.Medium)
        .withResources([])
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: 'organization2',
        finding: finding3,
      });

      const result = await repository.aggregateAll({
        assessmentId,
        organizationDomain: organizationDomain,
        version: assessment.latestVersionNumber,
        fields: {
          severity: true,
          resources: {
            region: true,
          },
        },
      });

      expect(result).toEqual({
        severity: {
          High: 1,
          Medium: 1,
        },
        resources: {
          region: {
            'us-east-1': 2,
            'us-east-2': 1,
          },
        },
      });
    });

    it('should return empty aggregation if no findings exist', async () => {
      const { repository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

      const result = await repository.aggregateAll({
        assessmentId,
        organizationDomain: 'organization1',
        version: 1,
        fields: {
          severity: true,
          resources: {
            region: true,
          },
        },
      });

      expect(result).toEqual({
        severity: {},
        resources: {
          region: {},
        },
      });
    });

    it('should return empty aggregation if no fields are provided', async () => {
      const { repository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withBestPractices('')
        .withSeverity(SeverityType.High)
        .withResources([
          {
            name: 'resource-1',
            type: 'AWS::S3::Bucket',
            uid: 'resource-uid-1',
            region: 'us-east-1',
          },
          {
            name: 'resource-2',
            type: 'AWS::EC2::Instance1',
            uid: 'resource-uid-2',
            region: 'us-east-2',
          },
        ])
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: 'organization1',
        finding: finding1,
      });

      const result = await repository.aggregateAll({
        assessmentId,
        organizationDomain: 'organization1',
        version: 1,
        fields: {},
      });

      expect(result).toEqual({});
    });
  });

  describe('countAll', () => {
    it('should count all findings', async () => {
      const { repository, assessmentRepository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const organizationDomain = 'organization1';

      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization(organizationDomain)
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withVersion(assessment.latestVersionNumber)
        .withBestPractices('0#0#0')
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withVersion(assessment.latestVersionNumber)
        .withBestPractices('0#0#0')
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding2,
      });

      const finding3 = FindingMother.basic()
        .withId('tool#3')
        .withVersion(assessment.latestVersionNumber)
        .withBestPractices('0#0#0')
        .build();
      await repository.save({
        assessmentId,
        organizationDomain,
        finding: finding3,
      });

      const count = await repository.countAll({
        assessmentId,
        organizationDomain,
        version: assessment.latestVersionNumber,
      });
      expect(count).toBe(3);
    });

    it('should be scoped by organization', async () => {
      const { repository, assessmentRepository } = setup();

      const assessmentId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
      const organizationDomain = 'organization1';
      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization(organizationDomain)
        .withLatestVersionNumber(1)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await assessmentRepository.save(assessment);
      await assessmentRepository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withVersion(assessment.latestVersionNumber)
        .withBestPractices('0#0#0')
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: organizationDomain,
        finding: finding1,
      });

      const finding2 = FindingMother.basic()
        .withId('tool#2')
        .withVersion(assessment.latestVersionNumber)
        .withBestPractices('')
        .build();
      await repository.save({
        assessmentId,
        organizationDomain: 'organization2',
        finding: finding2,
      });

      const count = await repository.countAll({
        assessmentId,
        organizationDomain: organizationDomain,
        version: assessment.latestVersionNumber,
      });
      expect(count).toBe(1);
    });

    it('should return 0 if no findings exist', async () => {
      const { repository } = setup();

      const count = await repository.countAll({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        version: 1,
      });
      expect(count).toBe(0);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    repository: new FindingsRepositorySQL(),
    assessmentRepository: new AssessmentsRepositorySQL(),
  };
};
