import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import { AssessmentMother, ScanningTool, SeverityType } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { GetScannedFindingsUseCaseImpl } from './GetScannedFindingsUseCase';
import { GetScannedFindingsUseCaseArgsMother } from './GetScannedFindingsUseCaseArgsMother';

describe('GetScannedFindings UseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = GetScannedFindingsUseCaseArgsMother.basic().build();

    await expect(useCase.getScannedFindings(input)).rejects.toThrow(
      AssessmentNotFoundError
    );
  });

  describe('prowler', () => {
    it('should format findings', async () => {
      const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } =
        setup();

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      await fakeObjectsStorage.put({
        key: `assessments/${assessment.id}/scans/prowler/json-ocsf/output.ocsf.json`,
        body: JSON.stringify([
          {
            risk_details: 'some risk details',
            status_detail: 'some status detail',
            metadata: { event_code: 'event-code' },
            remediation: {
              desc: 'remediation description',
              references: ['https://example.com'],
            },
            resources: [
              {
                name: 'resource-name',
                type: 'resource-type',
                region: 'us-east-1',
                uid: 'resource-uid',
              },
            ],
            status_code: 'FAIL',
            severity: SeverityType.Medium,
          },
        ]),
      });

      const input = GetScannedFindingsUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .withScanningTool(ScanningTool.PROWLER)
        .build();

      const result = await useCase.getScannedFindings(input);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'prowler#1',
          riskDetails: 'some risk details',
          statusDetail: 'some status detail',
          metadata: { eventCode: 'event-code' },
          remediation: {
            desc: 'remediation description',
            references: ['https://example.com'],
          },
          resources: [
            {
              name: 'resource-name',
              type: 'resource-type',
              region: 'us-east-1',
              uid: 'resource-uid',
            },
          ],
          statusCode: 'FAIL',
          severity: SeverityType.Medium,
        }),
      ]);
    });
  });

  describe('cloudsploit', () => {
    it('should format findings', async () => {
      const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } =
        setup();

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      await fakeObjectsStorage.put({
        key: `assessments/${assessment.id}/scans/cloudsploit/output.json`,
        body: JSON.stringify([
          {
            plugin: 'accessAnalyzerEnabled',
            category: 'IAM',
            title: 'Access Analyzer Enabled',
            description:
              'Ensure that IAM Access analyzer is enabled for all regions.',
            resource: 'arn:test',
            region: 'us-east-1',
            status: 'FAIL',
            message: 'Access Analyzer is not configured',
          },
        ]),
      });

      const input = GetScannedFindingsUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .withScanningTool(ScanningTool.CLOUDSPLOIT)
        .build();

      const result = await useCase.getScannedFindings(input);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'cloudsploit#1',
          statusDetail: 'Access Analyzer is not configured',
          riskDetails:
            'Ensure that IAM Access analyzer is enabled for all regions.',
          resources: [
            {
              region: 'us-east-1',
              uid: 'arn:test',
            },
          ],
          statusCode: 'FAIL',
        }),
      ]);
    });

    it('should only return findings with FAIL status', async () => {
      const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } =
        setup();

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      await fakeObjectsStorage.put({
        key: `assessments/${assessment.id}/scans/cloudsploit/output.json`,
        body: JSON.stringify([
          {
            plugin: 'accessAnalyzerEnabled',
            category: 'IAM',
            title: 'Access Analyzer Enabled',
            description:
              'Ensure that IAM Access analyzer is enabled for all regions.',
            resource: 'arn:test',
            region: 'us-east-1',
            status: 'FAIL',
            message: 'Access Analyzer is not configured',
          },
          {
            plugin: 'anotherPlugin',
            category: 'IAM',
            title: 'Another Plugin',
            description: 'This is another plugin description.',
            resource: 'arn:test2',
            region: 'us-east-1',
            status: 'PASS',
            message: 'Another plugin is configured',
          },
        ]),
      });

      const input = GetScannedFindingsUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .withScanningTool(ScanningTool.CLOUDSPLOIT)
        .build();

      const result = await useCase.getScannedFindings(input);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'cloudsploit#1',
          statusDetail: 'Access Analyzer is not configured',
          riskDetails:
            'Ensure that IAM Access analyzer is enabled for all regions.',
          resources: [
            {
              region: 'us-east-1',
              uid: 'arn:test',
            },
          ],
          statusCode: 'FAIL',
        }),
      ]);
    });

    it('should filter by region', async () => {
      const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } =
        setup();

      const assessment = AssessmentMother.basic()
        .withRegions(['us-west-2'])
        .build();
      await fakeAssessmentsRepository.save(assessment);

      await fakeObjectsStorage.put({
        key: `assessments/${assessment.id}/scans/cloudsploit/output.json`,
        body: JSON.stringify([
          {
            plugin: 'accessAnalyzerEnabled',
            category: 'IAM',
            title: 'Access Analyzer Enabled',
            description:
              'Ensure that IAM Access analyzer is enabled for all regions.',
            resource: 'arn:test',
            region: 'us-west-2',
            status: 'FAIL',
            message: 'Access Analyzer is not configured',
          },
          {
            plugin: 'anotherPlugin',
            category: 'IAM',
            title: 'Another Plugin',
            description: 'This is another plugin description.',
            resource: 'arn:test2',
            region: 'us-east-1',
            status: 'FAIL',
            message: 'Another plugin is configured',
          },
        ]),
      });

      const input = GetScannedFindingsUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .withRegions(['us-west-2'])
        .withScanningTool(ScanningTool.CLOUDSPLOIT)
        .build();

      const result = await useCase.getScannedFindings(input);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'cloudsploit#1',
          statusDetail: 'Access Analyzer is not configured',
          riskDetails:
            'Ensure that IAM Access analyzer is enabled for all regions.',
          resources: [
            {
              region: 'us-west-2',
              uid: 'arn:test',
            },
          ],
          statusCode: 'FAIL',
        }),
      ]);
    });

    it('should only fill resource uid with non N/A values', async () => {
      const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } =
        setup();

      const assessment = AssessmentMother.basic().build();
      await fakeAssessmentsRepository.save(assessment);

      await fakeObjectsStorage.put({
        key: `assessments/${assessment.id}/scans/cloudsploit/output.json`,
        body: JSON.stringify([
          {
            plugin: 'accessAnalyzerEnabled',
            category: 'IAM',
            title: 'Access Analyzer Enabled',
            description:
              'Ensure that IAM Access analyzer is enabled for all regions.',
            resource: 'arn:test',
            region: 'us-east-1',
            status: 'FAIL',
            message: 'Access Analyzer is not configured',
          },
          {
            plugin: 'anotherPlugin',
            category: 'IAM',
            title: 'Another Plugin',
            description: 'This is another plugin description.',
            resource: 'N/A',
            region: 'us-east-1',
            status: 'FAIL',
            message: 'Another plugin is configured',
          },
        ]),
      });

      const input = GetScannedFindingsUseCaseArgsMother.basic()
        .withAssessmentId(assessment.id)
        .withOrganization(assessment.organization)
        .withScanningTool(ScanningTool.CLOUDSPLOIT)
        .build();

      const result = await useCase.getScannedFindings(input);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'cloudsploit#1',
          statusDetail: 'Access Analyzer is not configured',
          riskDetails:
            'Ensure that IAM Access analyzer is enabled for all regions.',
          resources: [
            {
              region: 'us-east-1',
              uid: 'arn:test',
            },
          ],
          statusCode: 'FAIL',
        }),
        expect.objectContaining({
          id: 'cloudsploit#2',
          statusDetail: 'Another plugin is configured',
          riskDetails: 'This is another plugin description.',
          resources: [
            {
              region: 'us-east-1',
              uid: undefined, // N/A resource should not have uid
            },
          ],
          statusCode: 'FAIL',
        }),
      ]);
    });
  });

  it('should not return findings with resource with self made signature', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    await fakeObjectsStorage.put({
      key: `assessments/${assessment.id}/scans/prowler/json-ocsf/output.ocsf.json`,
      body: JSON.stringify([
        {
          risk_details: 'wafr-automation-tool risk',
          status_detail: 'some status detail',
          metadata: { event_code: 'event-code' },
          remediation: {
            desc: 'remediation description',
            references: ['https://example.com'],
          },
          resources: [
            {
              name: 'wafr-automation-tool-resource',
              type: 'resource-type',
              region: 'us-east-1',
              uid: 'resource-uid',
            },
          ],
          status_code: 'FAIL',
          severity: SeverityType.Medium,
        },
      ]),
    });

    const input = GetScannedFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    const result = await useCase.getScannedFindings(input);

    expect(result).toEqual([]);
  });

  it('should not return findings with self made signature in risk details', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    await fakeObjectsStorage.put({
      key: `assessments/${assessment.id}/scans/prowler/json-ocsf/output.ocsf.json`,
      body: JSON.stringify([
        {
          risk_details: 'wafr-automation-tool risk',
          status_detail: 'some status detail',
          metadata: { event_code: 'event-code' },
          remediation: {
            desc: 'remediation description',
            references: ['https://example.com'],
          },
          resources: [
            {
              name: 'resource-name',
              type: 'resource-type',
              region: 'us-east-1',
              uid: 'resource-uid',
            },
          ],
          status_code: 'FAIL',
          severity: SeverityType.Medium,
        },
      ]),
    });

    const input = GetScannedFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    const result = await useCase.getScannedFindings(input);

    expect(result).toEqual([]);
  });

  it('should not return findings with self made signature in status detail', async () => {
    const { useCase, fakeAssessmentsRepository, fakeObjectsStorage } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    await fakeObjectsStorage.put({
      key: `assessments/${assessment.id}/scans/prowler/json-ocsf/output.ocsf.json`,
      body: JSON.stringify([
        {
          risk_details: 'risk details',
          status_detail: 'wafr-automation-tool some status detail',
          metadata: { event_code: 'event-code' },
          remediation: {
            desc: 'remediation description',
            references: ['https://example.com'],
          },
          resources: [
            {
              name: 'resource-name',
              type: 'resource-type',
              region: 'us-east-1',
              uid: 'resource-uid',
            },
          ],
          status_code: 'FAIL',
          severity: SeverityType.Medium,
        },
      ]),
    });

    const input = GetScannedFindingsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganization(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    const result = await useCase.getScannedFindings(input);

    expect(result).toEqual([]);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new GetScannedFindingsUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
  };
};
