import {
  registerTestInfrastructure,
  tokenFakeObjectsStorage,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { MapScanFindingsToBestPracticesUseCaseImpl } from './MapScanFindingsToBestPracticesUseCase';
import { MapScanFindingsToBestPracticesUseCaseArgsMother } from './MapScanFindingsToBestPracticesUseCaseArgsMother';
import {
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  ScanFindingMother,
} from '@backend/models';

describe('MapScanFindingsToBestPractices UseCase', () => {
  it('should return empty best practices arrays if no mapping exists', async () => {
    const { useCase } = setup();
    const mockedScanFindings = [
      ScanFindingMother.basic().withId('tool#1').build(),
      ScanFindingMother.basic().withId('tool#2').build(),
    ];
    const args = MapScanFindingsToBestPracticesUseCaseArgsMother.basic()
      .withScanFindings(mockedScanFindings)
      .build();
    await expect(useCase.mapScanFindingsToBestPractices(args)).resolves.toEqual(
      [
        { scanFinding: mockedScanFindings[0], bestPractices: [] },
        { scanFinding: mockedScanFindings[1], bestPractices: [] },
      ]
    );
  });

  it('should map scan findings to best practices when it is possible', async () => {
    const { useCase, fakeObjectsStorage } = setup();
    const mockedScanFindings = [
      ScanFindingMother.basic()
        .withId('tool#1')
        .withMetadata({ eventCode: 'eventCode1' })
        .build(),
      ScanFindingMother.basic()
        .withId('tool#2')
        .withMetadata({ eventCode: 'eventCode2' })
        .build(),
      ScanFindingMother.basic()
        .withId('tool#3')
        .withMetadata({ eventCode: 'eventCode3' })
        .build(),
    ];
    fakeObjectsStorage.objects[
      MapScanFindingsToBestPracticesUseCaseImpl.mappingKey
    ] = JSON.stringify({
      eventCode1: [
        {
          pillar: 'security',
          question: 'securely-operate',
          best_practice: 'sec_securely_operate_multi_accounts',
        },
        {
          pillar: 'security',
          question: 'permissions',
          best_practice: 'sec_permissions_define_guardrails',
        },
      ],
      eventCode2: [
        {
          pillar: 'security',
          question: 'securely-operate',
          best_practice: 'sec_securely_operate_aws_account',
        },
      ],
    });
    const args = MapScanFindingsToBestPracticesUseCaseArgsMother.basic()
      .withScanFindings(mockedScanFindings)
      .withPillars([
        PillarMother.basic()
          .withId('pillar-1')
          .withPrimaryId('security')
          .withQuestions([
            QuestionMother.basic()
              .withId('question-1')
              .withPrimaryId('securely-operate')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('best-practice-1')
                  .withPrimaryId('sec_securely_operate_multi_accounts')
                  .build(),
                BestPracticeMother.basic()
                  .withId('best-practice-2')
                  .withPrimaryId('sec_securely_operate_aws_account')
                  .build(),
              ])
              .build(),
            QuestionMother.basic()
              .withId('question-2')
              .withPrimaryId('permissions')
              .withBestPractices([
                BestPracticeMother.basic()
                  .withId('best-practice-3')
                  .withPrimaryId('sec_permissions_define_guardrails')
                  .build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build();
    await expect(useCase.mapScanFindingsToBestPractices(args)).resolves.toEqual(
      [
        {
          scanFinding: mockedScanFindings[0],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-1',
            },
            {
              pillarId: 'pillar-1',
              questionId: 'question-2',
              bestPracticeId: 'best-practice-3',
            },
          ],
        },
        {
          scanFinding: mockedScanFindings[1],
          bestPractices: [
            {
              pillarId: 'pillar-1',
              questionId: 'question-1',
              bestPracticeId: 'best-practice-2',
            },
          ],
        },
        {
          scanFinding: mockedScanFindings[2],
          bestPractices: [],
        },
      ]
    );
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new MapScanFindingsToBestPracticesUseCaseImpl(),
    fakeObjectsStorage: inject(tokenFakeObjectsStorage),
  };
};
