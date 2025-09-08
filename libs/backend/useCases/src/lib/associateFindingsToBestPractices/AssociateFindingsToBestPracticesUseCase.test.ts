import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFindingToBestPracticesAssociationService,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { AssociateFindingsToBestPracticesUseCaseImpl } from './AssociateFindingsToBestPracticesUseCase';
import { AssociateFindingsToBestPracticesUseCaseArgsMother } from './AssociateFindingsToBestPracticesUseCaseArgsMother';

describe('AssociateFindingsToBestPracticesUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessments = {};
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganizationDomain('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .build();
    await expect(
      useCase.associateFindingsToBestPractices(args)
    ).rejects.toThrow(AssessmentNotFoundError);
  });

  it('should call the association service with findings, scanningTool & pillars', async () => {
    const {
      useCase,
      questionSetService,
      findingToBestPracticesAssociationService,
      fakeAssessmentsRepository,
    } = setup();
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .build();

    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganizationDomain('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings([
        FindingMother.basic().withId('prowler#1').build(),
        FindingMother.basic().withId('prowler#2').build(),
      ])
      .build();

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
    vi.spyOn(
      findingToBestPracticesAssociationService,
      'associateFindingsToBestPractices'
    );
    vi.spyOn(questionSetService, 'get').mockReturnValue({
      pillars,
      version: '1.0',
    });

    await expect(
      useCase.associateFindingsToBestPractices(args)
    ).resolves.not.toThrow();

    expect(
      findingToBestPracticesAssociationService.associateFindingsToBestPractices
    ).toHaveBeenCalledWith({
      findings: args.findings,
      scanningTool: args.scanningTool,
      pillars,
    });
  });

  it('should store findings from associations', async () => {
    const {
      useCase,
      questionSetService,
      findingToBestPracticesAssociationService,
      fakeAssessmentsRepository,
    } = setup();
    const pillars = [
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
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .withPillars(pillars)
      .build();
    const findings = [
      FindingMother.basic().withId('prowler#1').build(),
      FindingMother.basic().withId('prowler#2').build(),
    ];
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganizationDomain('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings(findings)
      .build();

    vi.spyOn(questionSetService, 'get').mockResolvedValue({
      pillars,
      version: '1.0',
    });
    vi.spyOn(
      findingToBestPracticesAssociationService,
      'associateFindingsToBestPractices'
    ).mockResolvedValue([
      {
        finding: findings[0],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'best-practice-1',
          },
        ],
      },
      {
        finding: findings[1],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'best-practice-2',
          },
        ],
      },
    ]);
    await useCase.associateFindingsToBestPractices(args);
    expect(
      fakeAssessmentsRepository.assessmentFindings[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
      ]
    ).toEqual([
      expect.objectContaining({ id: 'prowler#1', isAIAssociated: true }),
      expect.objectContaining({ id: 'prowler#2', isAIAssociated: true }),
    ]);
  });

  it('should update assessment best practices results with findings associations', async () => {
    const {
      useCase,
      questionSetService,
      findingToBestPracticesAssociationService,
      fakeAssessmentsRepository,
    } = setup();
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
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .withPillars(pillars)
      .build();
    const findings = [
      FindingMother.basic().withId('prowler#1').build(),
      FindingMother.basic().withId('prowler#2').build(),
    ];
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganizationDomain('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings(findings)
      .build();

    vi.spyOn(questionSetService, 'get').mockResolvedValue({
      pillars,
      version: '1.0',
    });
    vi.spyOn(
      findingToBestPracticesAssociationService,
      'associateFindingsToBestPractices'
    ).mockResolvedValue([
      {
        finding: findings[0],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'best-practice-1',
          },
        ],
      },
      {
        finding: findings[1],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'best-practice-1',
          },
        ],
      },
    ]);
    await useCase.associateFindingsToBestPractices(args);
    const assessment =
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
      ];
    const bestPractice = assessment.pillars?.[0].questions[0].bestPractices[0];
    expect(bestPractice?.results).toEqual(new Set(['prowler#1', 'prowler#2']));
  });

  it('should update all best practices results with findings associations', async () => {
    const {
      useCase,
      questionSetService,
      findingToBestPracticesAssociationService,
      fakeAssessmentsRepository,
    } = setup();
    const pillars = [
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
    fakeAssessmentsRepository.assessments[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
    ] = AssessmentMother.basic()
      .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganization('organization-id')
      .withPillars(pillars)
      .build();
    const findings = [
      FindingMother.basic().withId('prowler#1').build(),
      FindingMother.basic().withId('prowler#2').build(),
    ];
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganizationDomain('organization-id')
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings(findings)
      .build();

    vi.spyOn(questionSetService, 'get').mockResolvedValue({
      pillars,
      version: '1.0',
    });
    vi.spyOn(
      findingToBestPracticesAssociationService,
      'associateFindingsToBestPractices'
    ).mockResolvedValue([
      {
        finding: findings[0],
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
      {
        finding: findings[1],
        bestPractices: [
          {
            pillarId: 'pillar-1',
            questionId: 'question-1',
            bestPracticeId: 'best-practice-2',
          },
        ],
      },
    ]);
    await useCase.associateFindingsToBestPractices(args);
    const assessment =
      fakeAssessmentsRepository.assessments[
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#organization-id'
      ];
    const bestPractice1 = assessment.pillars?.[0].questions[0].bestPractices[0];
    const bestPractice2 = assessment.pillars?.[0].questions[0].bestPractices[1];
    expect(bestPractice1?.results).toEqual(new Set(['prowler#1']));
    expect(bestPractice2?.results).toEqual(new Set(['prowler#1', 'prowler#2']));
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new AssociateFindingsToBestPracticesUseCaseImpl(),
    questionSetService: inject(tokenQuestionSetService),
    findingToBestPracticesAssociationService: inject(
      tokenFindingToBestPracticesAssociationService
    ),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
