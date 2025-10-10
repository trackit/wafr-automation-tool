import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
  tokenFindingToBestPracticesAssociationService,
  tokenQuestionSetService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentStep,
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
    const { useCase } = setup();

    const input = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withOrganizationDomain('organization-id')
      .build();

    await expect(
      useCase.associateFindingsToBestPractices(input),
    ).rejects.toThrow(AssessmentNotFoundError);
  });

  it('should update assessment step to ASSOCIATING_FINDINGS', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .build();

    await useCase.associateFindingsToBestPractices(input);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(updatedAssessment?.step).toBe(AssessmentStep.ASSOCIATING_FINDINGS);
  });

  it('should call the association service with findings, scanningTool & pillars', async () => {
    const {
      useCase,
      questionSetService,
      findingToBestPracticesAssociationService,
      fakeAssessmentsRepository,
    } = setup();

    const assessment = AssessmentMother.basic().build();
    await fakeAssessmentsRepository.save(assessment);

    const input = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
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
    vitest.spyOn(
      findingToBestPracticesAssociationService,
      'associateFindingsToBestPractices',
    );
    vitest.spyOn(questionSetService, 'get').mockReturnValue({
      pillars,
      version: '1.0',
    });

    await useCase.associateFindingsToBestPractices(input);

    expect(
      findingToBestPracticesAssociationService.associateFindingsToBestPractices,
    ).toHaveBeenCalledWith({
      findings: input.findings,
      scanningTool: input.scanningTool,
      pillars,
    });
  });

  it('should store findings from associations', async () => {
    const {
      useCase,
      questionSetService,
      findingToBestPracticesAssociationService,
      fakeAssessmentsRepository,
      fakeFindingsRepository,
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

    const assessment = AssessmentMother.basic().withPillars(pillars).build();
    await fakeAssessmentsRepository.save(assessment);

    const findings = [
      FindingMother.basic().withId('prowler#1').build(),
      FindingMother.basic().withId('prowler#2').build(),
    ];
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings(findings)
      .build();

    vitest.spyOn(questionSetService, 'get').mockResolvedValue({
      pillars,
      version: '1.0',
    });
    vitest
      .spyOn(
        findingToBestPracticesAssociationService,
        'associateFindingsToBestPractices',
      )
      .mockResolvedValue([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[0].id,
            },
          ],
        },
        {
          finding: findings[1],
          bestPractices: [
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[1].id,
            },
          ],
        },
      ]);

    await useCase.associateFindingsToBestPractices(args);

    const associatedFindings = await fakeFindingsRepository.getAll({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    expect(associatedFindings).toEqual([
      expect.objectContaining({ id: findings[0].id, isAIAssociated: true }),
      expect.objectContaining({ id: findings[1].id, isAIAssociated: true }),
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

    const assessment = AssessmentMother.basic().withPillars(pillars).build();
    await fakeAssessmentsRepository.save(assessment);

    const findings = [
      FindingMother.basic().withId('prowler#1').build(),
      FindingMother.basic().withId('prowler#2').build(),
    ];
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings(findings)
      .build();

    vitest.spyOn(questionSetService, 'get').mockResolvedValue({
      pillars,
      version: '1.0',
    });
    vitest
      .spyOn(
        findingToBestPracticesAssociationService,
        'associateFindingsToBestPractices',
      )
      .mockResolvedValue([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[0].id,
            },
          ],
        },
        {
          finding: findings[1],
          bestPractices: [
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[0].id,
            },
          ],
        },
      ]);

    await useCase.associateFindingsToBestPractices(args);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    const bestPractice =
      updatedAssessment?.pillars?.[0].questions[0].bestPractices[0];
    expect(bestPractice?.results).toEqual(
      new Set([findings[0].id, findings[1].id]),
    );
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

    const assessment = AssessmentMother.basic().withPillars(pillars).build();
    await fakeAssessmentsRepository.save(assessment);

    const findings = [
      FindingMother.basic().withId('prowler#1').build(),
      FindingMother.basic().withId('prowler#2').build(),
    ];
    const args = AssociateFindingsToBestPracticesUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withOrganizationDomain(assessment.organization)
      .withScanningTool(ScanningTool.PROWLER)
      .withFindings(findings)
      .build();

    vitest.spyOn(questionSetService, 'get').mockResolvedValue({
      pillars,
      version: '1.0',
    });
    vitest
      .spyOn(
        findingToBestPracticesAssociationService,
        'associateFindingsToBestPractices',
      )
      .mockResolvedValue([
        {
          finding: findings[0],
          bestPractices: [
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[0].id,
            },
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[1].id,
            },
          ],
        },
        {
          finding: findings[1],
          bestPractices: [
            {
              pillarId: pillars[0].id,
              questionId: pillars[0].questions[0].id,
              bestPracticeId: pillars[0].questions[0].bestPractices[1].id,
            },
          ],
        },
      ]);

    await useCase.associateFindingsToBestPractices(args);

    const updatedAssessment = await fakeAssessmentsRepository.get({
      assessmentId: assessment.id,
      organizationDomain: assessment.organization,
    });
    const bestPractice1 =
      updatedAssessment?.pillars?.[0].questions[0].bestPractices[0];
    const bestPractice2 =
      updatedAssessment?.pillars?.[0].questions[0].bestPractices[1];
    expect(bestPractice1?.results).toEqual(new Set([findings[0].id]));
    expect(bestPractice2?.results).toEqual(
      new Set([findings[0].id, findings[1].id]),
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new AssociateFindingsToBestPracticesUseCaseImpl(),
    questionSetService: inject(tokenQuestionSetService),
    findingToBestPracticesAssociationService: inject(
      tokenFindingToBestPracticesAssociationService,
    ),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
