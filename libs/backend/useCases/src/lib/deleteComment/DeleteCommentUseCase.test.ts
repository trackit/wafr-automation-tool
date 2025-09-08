import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
} from '@backend/infrastructure';
import {
  FindingCommentMother,
  FindingMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  FindingCommentForbiddenError,
  FindingCommentNotFoundError,
  FindingNotFoundError,
} from '../../errors';
import { DeleteCommentUseCaseImpl } from './DeleteCommentUseCase';
import { DeleteCommentUseCaseArgsMother } from './DeleteCommentUseCaseArgsMother';

describe('DeleteCommentUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [];

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingNotFoundError
    );
  });

  it('should throw FindingCommentNotFoundError if the comment does not exist in the finding', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments([FindingCommentMother.basic().build()])
        .build(),
    ];

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#12345')
      .withCommentId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed2')
      .withUser(
        UserMother.basic()
          .withOrganizationDomain('test.io')
          .withEmail('user@test.io')
          .build()
      )
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingCommentNotFoundError
    );
  });

  it('should throw FindingCommentForbiddenError if user is not the comment author', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments([
          FindingCommentMother.basic()
            .withAuthorId('other-user-id')
            .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .build(),
        ])
        .build(),
    ];

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#12345')
      .withCommentId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(
        UserMother.basic()
          .withId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
          .withOrganizationDomain('test.io')
          .build()
      )
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingCommentForbiddenError
    );
  });

  it('should delete the comment', async () => {
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

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#12345')
      .withCommentId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withUser(
        UserMother.basic()
          .withId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
          .withOrganizationDomain('test.io')
          .build()
      )
      .build();

    await useCase.deleteComment(input);

    const finding = fakeAssessmentsRepository.assessmentFindings[
      '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed#test.io'
    ].find((finding) => finding.id === 'scanning-tool#12345');
    expect(finding).toBeDefined();
    expect(finding?.comments).toBeDefined();
    expect(
      finding?.comments?.find(
        (c) => c.id === '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
      )
    ).toBeUndefined();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new DeleteCommentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
