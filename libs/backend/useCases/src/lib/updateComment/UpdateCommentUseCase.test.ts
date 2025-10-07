import {
  registerTestInfrastructure,
  tokenFakeFindingsRepository,
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
import { UpdateCommentUseCaseImpl } from './UpdateCommentUseCase';
import { UpdateCommentUseCaseArgsMother } from './UpdateCommentUseCaseArgsMother';

describe('UpdateCommentUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase } = setup();

    const user = UserMother.basic().build();

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(user)
      .build();

    await expect(useCase.updateComment(input)).rejects.toThrow(
      FindingNotFoundError,
    );
  });

  it('should throw FindingCommentNotFoundError if comment does not exist in the finding', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const finding = FindingMother.basic()
      .withComments([FindingCommentMother.basic().build()])
      .build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withCommentId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed2')
      .withUser(user)
      .build();

    await expect(useCase.updateComment(input)).rejects.toThrow(
      FindingCommentNotFoundError,
    );
  });

  it('should throw FindingCommentForbiddenError if user is not the comment author', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const comment = FindingCommentMother.basic()
      .withAuthorId('other-user-id')
      .build();

    const finding = FindingMother.basic().withComments([comment]).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withCommentId(comment.id)
      .withUser(user)
      .build();

    await expect(useCase.updateComment(input)).rejects.toThrow(
      FindingCommentForbiddenError,
    );
  });

  it('should update comment using the provided comment body', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const comment = FindingCommentMother.basic()
      .withAuthorId(user.id)
      .withText('old-comment-text')
      .build();

    const finding = FindingMother.basic().withComments([comment]).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = UpdateCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withCommentId(comment.id)
      .withCommentBody({
        text: 'new-comment-text',
      })
      .withUser(user)
      .build();

    await useCase.updateComment(input);

    const updatedFinding = await fakeFindingsRepository.get({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      findingId: finding.id,
    });
    expect(updatedFinding).toBeDefined();
    expect(updatedFinding?.comments?.[0].text).toBe('new-comment-text');
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new UpdateCommentUseCaseImpl(),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
