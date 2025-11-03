import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
  tokenFakeQuestionSetService,
} from '@backend/infrastructure';
import {
  AssessmentGraphDataMother,
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  QuestionSetMother,
  ScanFindingMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { tokenGetScannedFindingsUseCase } from '../getScannedFindings';
import { tokenMapScanFindingsToBestPracticesUseCase } from '../mapScanFindingsToBestPractices';
import { tokenStoreFindingsToAssociateUseCase } from '../storeFindingsToAssociate';
import { PrepareFindingsAssociationsUseCaseImpl } from './PrepareFindingsAssociationsUseCase';
import { PrepareFindingsAssociationsUseCaseArgsMother } from './PrepareFindingsAssociationsUseCaseArgsMother';

describe('PrepareFindingsAssociationsUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic().build();

    await expect(useCase.prepareFindingsAssociations(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });

  it('should get scanned findings with args', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
    } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([]);
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      [],
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    await useCase.prepareFindingsAssociations(input);

    expect(
      getScannedFindingsUseCase.getScannedFindings,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        scanningTool: input.scanningTool,
        regions: input.regions,
        workflows: input.workflows,
      }),
    );
  });

  it('should map scanned findings to best practices', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
      fakeQuestionSetService,
    } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const mockedScanFindings = [
      ScanFindingMother.basic().withId('prowler#1').build(),
      ScanFindingMother.basic().withId('prowler#2').build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings,
    );
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      [],
    );

    const pillars = [
      PillarMother.basic()
        .withQuestions([
          QuestionMother.basic()
            .withBestPractices([BestPracticeMother.basic().build()])
            .build(),
        ])
        .build(),
    ];
    const questionSet = QuestionSetMother.basic().withPillars(pillars).build();
    vitest.spyOn(fakeQuestionSetService, 'get').mockReturnValue(questionSet);

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    await useCase.prepareFindingsAssociations(input);

    expect(
      mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        scanFindings: mockedScanFindings,
        pillars: pillars,
      }),
    );
  });

  it('should update assessment with rawGraphData', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeQuestionSetService,
      fakeAssessmentsRepository,
    } = setup();

    const cloudSploitGraphData = AssessmentGraphDataMother.basic()
      .withFindings(8)
      .withRegions({
        'us-east-1': 5,
        'us-west-2': 3,
      })
      .withResourceTypes({
        AwsAccount: 1,
        AwsEc2Instance: 2,
        AwsIamUser: 3,
        AwsS3Bucket: 1,
        AwsS3BucketPolicy: 1,
      })
      .withSeverities({
        [SeverityType.Critical]: 2,
        [SeverityType.High]: 3,
        [SeverityType.Medium]: 2,
        [SeverityType.Low]: 1,
      })
      .build();

    const assessment = AssessmentMother.basic()
      .withRawGraphData({ [ScanningTool.CLOUDSPLOIT]: cloudSploitGraphData })
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const mockedScanFindings = [
      ScanFindingMother.basic()
        .withSeverity(SeverityType.Low)
        .withResources([{ type: 'type-1', region: 'us-east-1' }])
        .build(),
      ScanFindingMother.basic()
        .withSeverity(SeverityType.Low)
        .withResources([{ type: 'type-2', region: 'us-east-1' }])
        .build(),
      ScanFindingMother.basic()
        .withSeverity(SeverityType.Medium)
        .withResources([{ type: 'type-2', region: 'us-east-1' }])
        .build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings,
    );
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      [],
    );

    const pillars = [
      PillarMother.basic()
        .withQuestions([
          QuestionMother.basic()
            .withBestPractices([BestPracticeMother.basic().build()])
            .build(),
        ])
        .build(),
    ];
    const questionSet = QuestionSetMother.basic().withPillars(pillars).build();
    vitest.spyOn(fakeQuestionSetService, 'get').mockReturnValue(questionSet);

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    await useCase.prepareFindingsAssociations(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment).toEqual(
      expect.objectContaining({
        rawGraphData: {
          [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic()
            .withFindings(3)
            .withRegions({ 'us-east-1': 3 })
            .withResourceTypes({ 'type-1': 1, 'type-2': 2 })
            .withSeverities({
              [SeverityType.Medium]: 1,
              [SeverityType.Low]: 2,
            })
            .build(),
          [ScanningTool.CLOUDSPLOIT]: cloudSploitGraphData,
        },
      }),
    );
  });

  it('should update assessment with pillars and questionVersion for Prowler', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
      fakeQuestionSetService,
      fakeFindingsRepository,
    } = setup();

    const mockedScanFindings = [
      ScanFindingMother.basic()
        .withId('prowler#1')
        .withSeverity(SeverityType.Low)
        .withResources([{ type: 'type-1', region: 'us-east-1' }])
        .build(),
      ScanFindingMother.basic()
        .withId('prowler#2')
        .withSeverity(SeverityType.Low)
        .withResources([{ type: 'type-2', region: 'us-east-1' }])
        .build(),
      ScanFindingMother.basic()
        .withId('prowler#3')
        .withSeverity(SeverityType.Medium)
        .withResources([{ type: 'type-2', region: 'us-east-1' }])
        .build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings,
    );
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      [
        {
          scanFinding: mockedScanFindings[0],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
          ],
        },
        {
          scanFinding: mockedScanFindings[1],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
          ],
        },
        { scanFinding: mockedScanFindings[2], bestPractices: [] },
      ],
    );

    const pillars = [
      PillarMother.basic()
        .withId('pillar-1')
        .withQuestions([
          QuestionMother.basic()
            .withId('question-1')
            .withBestPractices([
              BestPracticeMother.basic().withId('best-practice-1').build(),
            ])
            .build(),
        ])
        .build(),
    ];
    const questionSet = QuestionSetMother.basic().withPillars(pillars).build();

    const assessment = AssessmentMother.basic().withPillars(pillars).build();
    await fakeAssessmentsRepository.save(assessment);
    vitest.spyOn(fakeQuestionSetService, 'get').mockReturnValue(questionSet);

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    await useCase.prepareFindingsAssociations(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment).toEqual(
      expect.objectContaining({
        questionVersion: questionSet.version,
      }),
    );
    const bestPracticeFindings =
      await fakeFindingsRepository.getBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        pillarId: 'pillar-1',
        questionId: 'question-1',
        bestPracticeId: 'best-practice-1',
      });

    expect(bestPracticeFindings.findings).toHaveLength(2);
    expect(bestPracticeFindings.findings.map((f) => f.id)).toEqual(
      expect.arrayContaining([
        mockedScanFindings[0].id,
        mockedScanFindings[1].id,
      ]),
    );
  });

  it('should save scan findings with mapped best practices', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
      fakeFindingsRepository,
    } = setup();

    const bestPractice = BestPracticeMother.basic().build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic().withPillars([pillar]).build();
    await fakeAssessmentsRepository.save(assessment);

    const scanFinding = ScanFindingMother.basic().build();
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([
      scanFinding,
    ]);
    const scanFindingsToBestPracticesMapping = [
      {
        scanFinding,
        bestPractices: [
          {
            pillarId: pillar.id,
            questionId: question.id,
            bestPracticeId: bestPractice.id,
          },
        ],
      },
    ];
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      scanFindingsToBestPracticesMapping,
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    await useCase.prepareFindingsAssociations(input);

    const finding = await fakeFindingsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      findingId: scanFinding.id,
    });
    expect(finding).toEqual(
      expect.objectContaining({
        id: scanFinding.id,
        bestPractices: [bestPractice],
        isAIAssociated: false,
        hidden: false,
      }),
    );
  });

  it('should not save scan findings with empty mapped best practices', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
      fakeFindingsRepository,
    } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const scanFinding = ScanFindingMother.basic().build();
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([
      scanFinding,
    ]);
    const scanFindingsToBestPracticesMapping = [
      {
        scanFinding,
        bestPractices: [],
      },
    ];
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      scanFindingsToBestPracticesMapping,
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);

    const finding = await fakeFindingsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      findingId: scanFinding.id,
    });
    expect(finding).toBeUndefined();
  });

  it('should call StoreFindingsToAssociate with unmapped findings', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      storeFindingsToAssociateUseCase,
      fakeAssessmentsRepository,
    } = setup();

    const bestPractice = BestPracticeMother.basic().build();
    const question = QuestionMother.basic()
      .withBestPractices([bestPractice])
      .build();
    const pillar = PillarMother.basic().withQuestions([question]).build();
    const assessment = AssessmentMother.basic().withPillars([pillar]).build();
    await fakeAssessmentsRepository.save(assessment);

    const mockedScanFindings = [
      ScanFindingMother.basic().withId('prowler#1').build(),
      ScanFindingMother.basic().withId('prowler#2').build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings,
    );
    const scanFindingsToBestPracticesMapping = [
      {
        scanFinding: mockedScanFindings[0],
        bestPractices: [],
      },
      {
        scanFinding: mockedScanFindings[1],
        bestPractices: [
          {
            pillarId: pillar.id,
            questionId: question.id,
            bestPracticeId: bestPractice.id,
          },
        ],
      },
    ];
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      scanFindingsToBestPracticesMapping,
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    await useCase.prepareFindingsAssociations(input);

    expect(
      storeFindingsToAssociateUseCase.storeFindingsToAssociate,
    ).toHaveBeenCalledExactlyOnceWith({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
      scanningTool: input.scanningTool,
      scanFindings: [mockedScanFindings[0]],
    });
  });

  it('should forward StoreFindingsToAssociate return', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      storeFindingsToAssociateUseCase,
      fakeAssessmentsRepository,
    } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([]);
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      [],
    );
    const URIs = ['URI-1', 'URI-2'];
    storeFindingsToAssociateUseCase.storeFindingsToAssociate.mockResolvedValue(
      URIs,
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();

    const result = await useCase.prepareFindingsAssociations(input);

    expect(result).toEqual(URIs);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const getScannedFindingsUseCase = { getScannedFindings: vitest.fn() };
  register(tokenGetScannedFindingsUseCase, {
    useValue: getScannedFindingsUseCase,
  });

  const storeFindingsToAssociateUseCase = {
    storeFindingsToAssociate: vitest.fn(),
  };
  register(tokenStoreFindingsToAssociateUseCase, {
    useValue: storeFindingsToAssociateUseCase,
  });

  const mapScanFindingsToBestPracticesUseCase = {
    mapScanFindingsToBestPractices: vitest.fn(),
  };
  register(tokenMapScanFindingsToBestPracticesUseCase, {
    useValue: mapScanFindingsToBestPracticesUseCase,
  });

  return {
    useCase: new PrepareFindingsAssociationsUseCaseImpl(),
    getScannedFindingsUseCase,
    storeFindingsToAssociateUseCase,
    mapScanFindingsToBestPracticesUseCase,
    fakeQuestionSetService: inject(tokenFakeQuestionSetService),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
