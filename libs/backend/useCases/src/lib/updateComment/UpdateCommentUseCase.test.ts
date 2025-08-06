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

import { ForbiddenError, NotFoundError } from '../Errors';
import { UpdateCommentUseCaseImpl } from './UpdateCommentUseCase';
import { UpdateCommentUseCaseArgsMother } from './UpdateCommentUseCaseArgsMother';

describe('UpdateCommentUseCase', () => {
  it('should throw a NotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [];

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#finding-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.updateComment(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a NotFoundError if comment does not exist in the finding', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments({
          'comment-id': FindingCommentMother.basic().build(),
        })
        .build(),
    ];

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#12345')
      .withCommentId('comment-id2')
      .withUser(
        UserMother.basic()
          .withOrganizationDomain('test.io')
          .withEmail('user@test.io')
          .build()
      )
      .build();

    await expect(useCase.updateComment(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw a ForbiddenError if user is not the comment author', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments({
          'comment-id': FindingCommentMother.basic()
            .withAuthor('user@example.io')
            .withId('comment-id')
            .build(),
        })
        .build(),
    ];

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#12345')
      .withCommentId('comment-id')
      .withUser(
        UserMother.basic()
          .withOrganizationDomain('test.io')
          .withEmail('user@test.io')
          .build()
      )
      .build();

    await expect(useCase.updateComment(input)).rejects.toThrow(ForbiddenError);
  });

  it('should update comment using the provided comment body', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments({
          'comment-id': FindingCommentMother.basic()
            .withAuthor('user@test.io')
            .withId('comment-id')
            .withText('old-comment-text')
            .build(),
        })
        .build(),
    ];

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#12345')
      .withCommentId('comment-id')
      .withCommentBody({
        text: 'new-comment-text',
      })
      .withUser(
        UserMother.basic()
          .withOrganizationDomain('test.io')
          .withEmail('user@test.io')
          .build()
      )
      .build();

    await useCase.updateComment(input);

    const finding = fakeAssessmentsRepository.assessmentFindings[
      'assessment-id#test.io'
    ].find((finding) => finding.id === 'scanning-tool#12345');
    expect(finding).toBeDefined();
    expect(finding?.comments['comment-id']).toBeDefined();
    expect(finding?.comments['comment-id']?.text).toBe('new-comment-text');
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new UpdateCommentUseCaseImpl(),
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
