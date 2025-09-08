import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  FindingCommentMother,
  FindingMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { FindingNotFoundError } from '../../errors/FindingErrors';
import { AddCommentUseCaseImpl } from './AddCommentUseCase';
import { AddCommentUseCaseArgsMother } from './AddCommentUseCaseArgsMother';

describe('AddCommentUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [];

    const input = AddCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.addComment(input)).rejects.toThrow(
      FindingNotFoundError
    );
  });

  it('should handle backward compatibility if finding has no comments field', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const assessment = AssessmentMother.basic()
      .withId('assessment1')
      .withOrganization('organization1')
      .build();
    await fakeAssessmentsRepository.save(assessment);

    const finding = FindingMother.basic()
      .withId('scanningTool#12345')
      .withComments(undefined)
      .build();
    await fakeAssessmentsRepository.saveFinding({
      assessmentId: 'assessment1',
      organizationDomain: 'organization1',
      finding,
    });

    await useCase.addComment({
      assessmentId: 'assessment1',
      findingId: 'scanningTool#12345',
      text: 'This is a new comment',
      user: UserMother.basic()
        .withId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
        .withOrganizationDomain('organization1')
        .build(),
    });

    const findingWithComment = await fakeAssessmentsRepository.getFinding({
      assessmentId: 'assessment1',
      organizationDomain: 'organization1',
      findingId: finding.id,
    });

    expect(findingWithComment).toEqual(
      expect.objectContaining({
        comments: [
          expect.objectContaining({
            text: 'This is a new comment',
          }),
        ],
      })
    );
  });

  it('should add the comment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments([
          FindingCommentMother.basic()
            .withAuthorId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
            .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .build(),
        ])
        .build(),
    ];

    const input = AddCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#12345')
      .withText('This is a new comment')
      .withUser(
        UserMother.basic()
          .withId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
          .withOrganizationDomain('test.io')
          .build()
      )
      .build();

    await useCase.addComment(input);

    const finding = fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ].find((finding) => finding.id === 'scanning-tool#12345');
    expect(finding).toBeDefined();
    expect(finding?.comments).toBeDefined();
    expect(
      finding?.comments?.find(
        (c) => c.id === '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
      )
    ).toBeDefined();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new AddCommentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
