import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
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

import { NotFoundError } from '../Errors';
import { tokenGetScannedFindingsUseCase } from '../getScannedFindings';
import { tokenMapScanFindingsToBestPracticesUseCase } from '../mapScanFindingsToBestPractices';
import { tokenStoreFindingsToAssociateUseCase } from '../storeFindingsToAssociate';
import { PrepareFindingsAssociationsUseCaseImpl } from './PrepareFindingsAssociationsUseCase';
import { PrepareFindingsAssociationsUseCaseArgsMother } from './PrepareFindingsAssociationsUseCaseArgsMother';

describe('PrepareFindingsAssociations Use Case', () => {
  it('should throw an error if assessment is not found', async () => {
    const { useCase, getScannedFindingsUseCase, fakeAssessmentsRepository } =
      setup();
    fakeAssessmentsRepository.assessments = {};
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([]);
    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await expect(useCase.prepareFindingsAssociations(input)).rejects.toThrow(
      NotFoundError
    );
  });

  it('should get scanned findings with args', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
    } = setup();

    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([]);
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      []
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#test.io'
    ] = AssessmentMother.basic().build();

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);
    expect(
      getScannedFindingsUseCase.getScannedFindings
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
        scanningTool: ScanningTool.PROWLER,
        regions: ['us-east-1'],
        workflows: ['workflow-1'],
        organization: 'test.io',
      })
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

    const mockedScanFindings = [
      ScanFindingMother.basic().withId('prowler#1').build(),
      ScanFindingMother.basic().withId('prowler#2').build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings
    );
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      []
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#test.io'
    ] = AssessmentMother.basic().build();
    const questionVersion = 'question-set-version';
    const pillars = [
      PillarMother.basic()
        .withId('pillar-id')
        .withQuestions([
          QuestionMother.basic()
            .withId('question-id')
            .withBestPractices([
              BestPracticeMother.basic().withId('best-practice-id').build(),
            ])
            .build(),
        ])
        .build(),
    ];
    vi.spyOn(fakeQuestionSetService, 'get').mockReturnValue(
      QuestionSetMother.basic()
        .withVersion(questionVersion)
        .withPillars(pillars)
        .build()
    );
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      []
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);
    expect(
      mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        scanFindings: mockedScanFindings,
        pillars: pillars,
      })
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
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#organization-id'
    ] = assessment;

    const questionVersion = 'question-set-version';
    const pillars = [
      PillarMother.basic()
        .withId('pillar-id')
        .withQuestions([
          QuestionMother.basic()
            .withId('question-id')
            .withBestPractices([
              BestPracticeMother.basic().withId('best-practice-id').build(),
            ])
            .build(),
        ])
        .build(),
    ];
    vi.spyOn(fakeQuestionSetService, 'get').mockReturnValue(
      QuestionSetMother.basic()
        .withVersion(questionVersion)
        .withPillars(pillars)
        .build()
    );
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      []
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('organization-id')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);

    expect(
      fakeAssessmentsRepository.assessments[
        '14270881-e4b0-4f89-8941-449eed22071d#organization-id'
      ]
    ).toEqual(
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
      })
    );
  });

  it('should update assessment with pillars and questionVersion for Prowler', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
      fakeQuestionSetService,
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
      mockedScanFindings
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#organization-id'
    ] = AssessmentMother.basic().build();
    const questionVersion = 'question-set-version';
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
    vi.spyOn(fakeQuestionSetService, 'get').mockReturnValue(
      QuestionSetMother.basic()
        .withVersion(questionVersion)
        .withPillars(pillars)
        .build()
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
      ]
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('organization-id')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);

    expect(
      fakeAssessmentsRepository.assessments[
        '14270881-e4b0-4f89-8941-449eed22071d#organization-id'
      ]
    ).toEqual(
      expect.objectContaining({
        questionVersion,
      })
    );
    expect(
      fakeAssessmentsRepository.assessments[
        '14270881-e4b0-4f89-8941-449eed22071d#organization-id'
      ].pillars?.[0].questions[0].bestPractices[0].results
    ).toEqual(new Set(['prowler#1', 'prowler#2']));
  });

  it('should save scan findings with mapped best practices', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
    } = setup();
    const mockedScanFindings = [
      ScanFindingMother.basic().withId('prowler#1').build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#test.io'
    ] = AssessmentMother.basic().build();
    const scanFindingsToBestPracticesMapping = [
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
    ];
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      scanFindingsToBestPracticesMapping
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);

    expect(
      fakeAssessmentsRepository.assessmentFindings[
        '14270881-e4b0-4f89-8941-449eed22071d#test.io'
      ]
    ).toEqual([
      expect.objectContaining({
        id: 'prowler#1',
        bestPractices: 'pillar-1#question-1#best-practice-1',
        isAIAssociated: false,
        hidden: false,
      }),
    ]);
  });

  it('should not save scan findings with empty mapped best practices', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      fakeAssessmentsRepository,
    } = setup();
    const mockedScanFindings = [
      ScanFindingMother.basic().withId('prowler#1').build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#test.io'
    ] = AssessmentMother.basic().build();
    const scanFindingsToBestPracticesMapping = [
      {
        scanFinding: mockedScanFindings[0],
        bestPractices: [],
      },
    ];
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      scanFindingsToBestPracticesMapping
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);

    expect(
      fakeAssessmentsRepository.assessmentFindings[
        '14270881-e4b0-4f89-8941-449eed22071d#test.io'
      ]
    ).toBeUndefined();
  });

  it('should call StoreFindingsToAssociate with unmapped findings', async () => {
    const {
      useCase,
      getScannedFindingsUseCase,
      mapScanFindingsToBestPracticesUseCase,
      storeFindingsToAssociateUseCase,
      fakeAssessmentsRepository,
    } = setup();
    const mockedScanFindings = [
      ScanFindingMother.basic().withId('prowler#1').build(),
      ScanFindingMother.basic().withId('prowler#2').build(),
    ];
    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue(
      mockedScanFindings
    );
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#test.io'
    ] = AssessmentMother.basic().build();
    const scanFindingsToBestPracticesMapping = [
      {
        scanFinding: mockedScanFindings[0],
        bestPractices: [],
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
    ];
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      scanFindingsToBestPracticesMapping
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await useCase.prepareFindingsAssociations(input);
    expect(
      storeFindingsToAssociateUseCase.storeFindingsToAssociate
    ).toHaveBeenCalledExactlyOnceWith({
      assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
      organization: 'test.io',
      scanningTool: ScanningTool.PROWLER,
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

    getScannedFindingsUseCase.getScannedFindings.mockResolvedValue([]);
    fakeAssessmentsRepository.assessments[
      '14270881-e4b0-4f89-8941-449eed22071d#test.io'
    ] = AssessmentMother.basic().build();
    mapScanFindingsToBestPracticesUseCase.mapScanFindingsToBestPractices.mockResolvedValue(
      []
    );
    const URIs = ['URI-1', 'URI-2'];
    storeFindingsToAssociateUseCase.storeFindingsToAssociate.mockResolvedValue(
      URIs
    );

    const input = PrepareFindingsAssociationsUseCaseArgsMother.basic()
      .withAssessmentId('14270881-e4b0-4f89-8941-449eed22071d')
      .withOrganization('test.io')
      .withRegions(['us-east-1'])
      .withWorkflows(['workflow-1'])
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    const result = await useCase.prepareFindingsAssociations(input);
    expect(result).toEqual(URIs);
  });

  describe('formatPillarsForAssessmentUpdate', () => {
    it('should format pillars using mapped scanned findings to best practices', () => {
      const { useCase } = setup();
      const rawPillars = [
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
      const scanFindingsToBestPractices = [
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#1')
            .build(),
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
          ],
        },
      ];

      const formattedPillars = useCase.formatPillarsForAssessmentUpdate({
        rawPillars,
        scanFindingsToBestPractices,
      });
      expect(formattedPillars).toEqual([
        expect.objectContaining({
          id: 'pillar-1',
          questions: [
            expect.objectContaining({
              id: 'question-1',
              bestPractices: [
                expect.objectContaining({
                  id: 'best-practice-1',
                  results: new Set(['scanningTool#1']),
                }),
              ],
            }),
          ],
        }),
      ]);
    });

    it('should format pillars with no mapped best practices', () => {
      const { useCase } = setup();
      const rawPillars = [
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
      const scanFindingsToBestPractices = [
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#1')
            .build(),
          bestPractices: [],
        },
      ];

      const formattedPillars = useCase.formatPillarsForAssessmentUpdate({
        rawPillars,
        scanFindingsToBestPractices,
      });
      expect(formattedPillars).toEqual([
        expect.objectContaining({
          id: 'pillar-1',
          questions: [
            expect.objectContaining({
              id: 'question-1',
              bestPractices: [
                expect.objectContaining({
                  id: 'best-practice-1',
                  results: new Set([]),
                }),
              ],
            }),
          ],
        }),
      ]);
    });

    it('should handle multiple mapped best practices for a single scan finding', () => {
      const { useCase } = setup();
      const rawPillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic().withId('best-practice-1').build(),
                BestPracticeMother.basic().withId('best-practice-2').build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const scanFindingsToBestPractices = [
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#1')
            .build(),
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-2',
            },
          ],
        },
      ];

      const formattedPillars = useCase.formatPillarsForAssessmentUpdate({
        rawPillars,
        scanFindingsToBestPractices,
      });
      expect(formattedPillars).toEqual([
        expect.objectContaining({
          id: 'pillar-1',
          questions: [
            expect.objectContaining({
              id: 'question-1',
              bestPractices: [
                expect.objectContaining({
                  id: 'best-practice-1',
                  results: new Set(['scanningTool#1']),
                }),
                expect.objectContaining({
                  id: 'best-practice-2',
                  results: new Set(['scanningTool#1']),
                }),
              ],
            }),
          ],
        }),
      ]);
    });

    it('should handle multiple scan findings for a single best practice', () => {
      const { useCase } = setup();
      const rawPillars = [
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
      const scanFindingsToBestPractices = [
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#1')
            .build(),
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
          ],
        },
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#2')
            .build(),
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
          ],
        },
      ];

      const formattedPillars = useCase.formatPillarsForAssessmentUpdate({
        rawPillars,
        scanFindingsToBestPractices,
      });
      expect(formattedPillars).toEqual([
        expect.objectContaining({
          id: 'pillar-1',
          questions: [
            expect.objectContaining({
              id: 'question-1',
              bestPractices: [
                expect.objectContaining({
                  id: 'best-practice-1',
                  results: new Set(['scanningTool#1', 'scanningTool#2']),
                }),
              ],
            }),
          ],
        }),
      ]);
    });

    it('should handle multiple scan findings with different best practices', () => {
      const { useCase } = setup();
      const rawPillars = [
        PillarMother.basic()
          .withId('pillar-1')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withBestPractices([
                BestPracticeMother.basic().withId('best-practice-1').build(),
              ])
              .build(),
            QuestionMother.basic()
              .withId('question-2')
              .withBestPractices([
                BestPracticeMother.basic().withId('best-practice-2').build(),
              ])
              .build(),
          ])
          .build(),
      ];
      const scanFindingsToBestPractices = [
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#1')
            .build(),
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
          ],
        },
        {
          scanFinding: ScanFindingMother.basic()
            .withId('scanningTool#2')
            .build(),
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-2',
              bestPracticeId: 'best-practice-2',
            },
          ],
        },
      ];

      const formattedPillars = useCase.formatPillarsForAssessmentUpdate({
        rawPillars,
        scanFindingsToBestPractices,
      });
      expect(formattedPillars).toEqual([
        expect.objectContaining({
          id: 'pillar-1',
          questions: [
            expect.objectContaining({
              id: 'question-1',
              bestPractices: [
                expect.objectContaining({
                  id: 'best-practice-1',
                  results: new Set(['scanningTool#1']),
                }),
              ],
            }),
            expect.objectContaining({
              id: 'question-2',
              bestPractices: [
                expect.objectContaining({
                  id: 'best-practice-2',
                  results: new Set(['scanningTool#2']),
                }),
              ],
            }),
          ],
        }),
      ]);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const getScannedFindingsUseCase = { getScannedFindings: vi.fn() };
  const mapScanFindingsToBestPracticesUseCase = {
    mapScanFindingsToBestPractices: vi.fn(),
  };
  const storeFindingsToAssociateUseCase = { storeFindingsToAssociate: vi.fn() };
  register(tokenGetScannedFindingsUseCase, {
    useValue: getScannedFindingsUseCase,
  });
  register(tokenMapScanFindingsToBestPracticesUseCase, {
    useValue: mapScanFindingsToBestPracticesUseCase,
  });
  register(tokenStoreFindingsToAssociateUseCase, {
    useValue: storeFindingsToAssociateUseCase,
  });
  return {
    getScannedFindingsUseCase,
    mapScanFindingsToBestPracticesUseCase,
    storeFindingsToAssociateUseCase,
    fakeQuestionSetService: inject(tokenFakeQuestionSetService),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    useCase: new PrepareFindingsAssociationsUseCaseImpl(),
  };
};
