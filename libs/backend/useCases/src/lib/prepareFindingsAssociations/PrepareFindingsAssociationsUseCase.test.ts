import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
  tokenFakeQuestionSetService,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  AssessmentVersionMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  QuestionSetMother,
  ScanFindingMother,
  ScanningTool,
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
    const assessment = AssessmentMother.basic().build();
    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: assessment.organization,
    });

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
      version: assessment.latestVersionNumber,
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
      version: assessment.latestVersionNumber,
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
    const assessment = AssessmentMother.basic().build();
    const assessmentVersion = AssessmentVersionMother.basic()
      .withAssessmentId(assessment.id)
      .withPillars([pillar])
      .build();
    await fakeAssessmentsRepository.save(assessment);
    await fakeAssessmentsRepository.createVersion({
      assessmentVersion,
      organizationDomain: assessment.organization,
    });

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
