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
import { DeleteCommentUseCaseImpl } from './DeleteCommentUseCase';
import { DeleteCommentUseCaseArgsMother } from './DeleteCommentUseCaseArgsMother';

describe('DeleteCommentUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase } = setup();

    const user = UserMother.basic().build();

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(user)
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingNotFoundError,
    );
  });

  it('should throw FindingCommentNotFoundError if the comment does not exist in the finding', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const comment = FindingCommentMother.basic()
      .withAuthorId(user.id)
      .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .build();
    const finding = FindingMother.basic().withComments([comment]).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withCommentId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed2')
      .withUser(user)
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingCommentNotFoundError,
    );
  });

  it('should throw FindingCommentForbiddenError if user is not the comment author', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic()
      .withId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
      .build();

    const comment = FindingCommentMother.basic()
      .withAuthorId('other-user-id')
      .build();
    const finding = FindingMother.basic().withComments([comment]).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withCommentId(comment.id)
      .withUser(user)
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingCommentForbiddenError,
    );
  });

  it('should delete the comment', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const comment = FindingCommentMother.basic().withAuthorId(user.id).build();
    const finding = FindingMother.basic().withComments([comment]).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withCommentId(comment.id)
      .withUser(user)
      .build();

    await useCase.deleteComment(input);

    const updatedFinding = await fakeFindingsRepository.get({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      findingId: finding.id,
    });
    expect(updatedFinding).toBeDefined();
    expect(updatedFinding?.comments).toBeDefined();
    expect(
      updatedFinding?.comments?.find((c) => c.id === comment.id),
    ).toBeUndefined();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new DeleteCommentUseCaseImpl(),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
