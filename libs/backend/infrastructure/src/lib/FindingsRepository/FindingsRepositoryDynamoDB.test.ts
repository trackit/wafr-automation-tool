import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  FindingCommentMother,
  FindingMother,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  tokenDynamoDBAssessmentTableName,
  tokenDynamoDBClient,
} from '../config/dynamodb/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { FindingsRepositoryDynamoDB } from './FindingsRepositoryDynamoDB';
import { GetBestPracticeFindingsAssessmentsRepositoryArgsMother } from './FindingsRepositoryGetBestPracticeFindingsArgsMother';

afterEach(async () => {
  const dynamoDBClient = inject(tokenDynamoDBClient);
  const tableName = inject(tokenDynamoDBAssessmentTableName);

  const scanResult = await dynamoDBClient.send(
    new ScanCommand({ TableName: tableName })
  );

  await Promise.all(
    (scanResult.Items || []).map(async (item) => {
      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
    })
  );
});

describe('FindingsRepositoryDynamoDB', () => {
  describe('save', () => {
    it('should save a finding by scanningTool for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withId('scanningTool#1')
        .withBestPractices('0#0#0')
        .withHidden(false)
        .withIsAIAssociated(false)
        .withMetadata({ eventCode: 'event1' })
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
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      const savedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#1',
        organizationDomain: 'organization1',
      });

      expect(savedFinding).toEqual(finding);
    });
  });

  describe('saveComment', () => {
    it('should add a comment to a finding', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withId('scanningTool#12345')
        .withComments([])
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      const comment = FindingCommentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .build();
      await repository.saveComment({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        comment,
      });

      const findingWithComment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
      });

      expect(findingWithComment).toEqual(
        expect.objectContaining({
          comments: [comment],
        })
      );
    });
  });

  describe('get', () => {
    it('should get finding for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic().withId('scanningTool#1').build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      const fetchedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#1',
        organizationDomain: 'organization1',
      });

      expect(fetchedFinding).toEqual(finding);
    });

    it('should return undefined if finding does not exist', async () => {
      const { repository } = setup();

      const fetchedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#1',
        organizationDomain: 'organization1',
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
        findingId: 'scanningTool#1',
        organizationDomain: 'organization1',
      });
      const fetchedFinding2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#2',
        organizationDomain: 'organization1',
      });

      expect(fetchedFinding1).toEqual(finding1);
      expect(fetchedFinding2).toBeUndefined();
    });
  });

  describe('getBestPracticeFindings', () => {
    it('should return all findings', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#1' }),
        expect.objectContaining({ id: 'tool#2' }),
      ]);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
        finding: finding2,
      });
      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([expect.objectContaining({ id: 'tool#1' })]);
    });

    it('should return an empty array if no findings exist', async () => {
      const { repository } = setup();

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([]);
    });

    it('should not return the hidden findings', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .withHidden(false)
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .withHidden(true)
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([expect.objectContaining({ id: 'tool#1' })]);
    });

    it('should only return the matching findings', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .withRiskDetails('dummy risk details')
        .withStatusDetail('dummy status detail')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .withStatusDetail('searchterm')
        .build();
      const finding3 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#3')
        .withRiskDetails('searchterm')
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding3,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withSearchTerm('searchterm')
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#2' }),
        expect.objectContaining({ id: 'tool#3' }),
      ]);
    });

    it('should only return a limited number of findings', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      const finding3 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#3')
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding3,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withLimit(2)
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#1' }),
        expect.objectContaining({ id: 'tool#2' }),
      ]);
    });

    it('should also return the hidden findings', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .withHidden(false)
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .withHidden(true)
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withShowHidden(true)
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#1' }),
        expect.objectContaining({ id: 'tool#2' }),
      ]);
    });

    it('should return a nextToken if more results are available', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });

      const { nextToken } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withLimit(1)
          .build()
      );
      expect(nextToken).toBeDefined();
    });

    it('should return more results using nextToken', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding2,
      });

      const { findings: firstFindings, nextToken } =
        await repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .withLimit(1)
            .build()
        );
      const { findings: secondFindings } =
        await repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .withNextToken(nextToken as string)
            .build()
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
      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding: finding1,
      });
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
      });
      const fetchedFinding2 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#2',
        organizationDomain: 'organization1',
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
      });
      const fetchedFinding2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'scanningTool#2',
        organizationDomain: 'organization2',
      });

      expect(fetchedFinding1).toBeUndefined();
      expect(fetchedFinding2).toEqual(finding2);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment from a finding', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withId('scanningTool#12345')
        .withComments([
          FindingCommentMother.basic()
            .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .build(),
        ])
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
        commentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      });

      const findingWithComment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
      });

      expect(findingWithComment).toEqual(
        expect.objectContaining({
          comments: [],
        })
      );
    });
  });

  describe('update', () => {
    it('should update the finding visibility', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withId('tool#1')
        .withHidden(false)
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      await repository.update({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: 'tool#1',
        findingBody: {
          hidden: true,
        },
      });

      const fetchedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'tool#1',
        organizationDomain: 'organization1',
      });

      expect(fetchedFinding).toEqual(
        expect.objectContaining({
          id: 'tool#1',
          hidden: true,
        })
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
        findingId: 'tool#1',
        findingBody: {
          hidden: true,
        },
      });

      const updatedFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'tool#1',
        organizationDomain: 'organization1',
      });
      const otherFinding = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'tool#1',
        organizationDomain: 'organization2',
      });

      expect(updatedFinding).toEqual(expect.objectContaining({ hidden: true }));
      expect(otherFinding).toEqual(expect.objectContaining({ hidden: false }));
    });
  });

  describe('updateComment', () => {
    it('should update a comment in a finding', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withId('scanningTool#12345')
        .withComments([
          FindingCommentMother.basic()
            .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .withText('old-comment-text')
            .build(),
        ])
        .build();
      await repository.save({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        finding,
      });

      await repository.updateComment({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
        commentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        commentBody: {
          text: 'new-comment-text',
        },
      });

      const findingWithComment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        findingId: finding.id,
      });

      expect(findingWithComment).toEqual(
        expect.objectContaining({
          comments: [
            expect.objectContaining({
              id: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
              text: 'new-comment-text',
            }),
          ],
        })
      );
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return { repository: new FindingsRepositoryDynamoDB() };
};
