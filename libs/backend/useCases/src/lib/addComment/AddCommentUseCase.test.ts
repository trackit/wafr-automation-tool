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

import { FindingNotFoundError } from '../../errors';
import { AddCommentUseCaseImpl } from './AddCommentUseCase';
import { AddCommentUseCaseArgsMother } from './AddCommentUseCaseArgsMother';

describe('AddCommentUseCase', () => {
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase } = setup();

    const user = UserMother.basic().build();

    const input = AddCommentUseCaseArgsMother.basic()
      .withFindingId('scanning-tool#finding-id')
      .withUser(user)
      .build();

    await expect(useCase.addComment(input)).rejects.toThrow(
      FindingNotFoundError,
    );
  });

  it('should handle backward compatibility if finding has no comments field', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const finding = FindingMother.basic().withComments(undefined).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = AddCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withText('This is a new comment')
      .withUser(user)
      .build();

    await useCase.addComment(input);

    const findingWithComment = await fakeFindingsRepository.get({
      assessmentId: input.assessmentId,
      organizationDomain: user.organizationDomain,
      findingId: input.findingId,
    });
    expect(findingWithComment).toEqual(
      expect.objectContaining({
        comments: [
          expect.objectContaining({
            text: input.text,
          }),
        ],
      }),
    );
  });

  it('should add the comment', async () => {
    const { useCase, fakeFindingsRepository } = setup();

    const user = UserMother.basic().build();

    const comment = FindingCommentMother.basic().withAuthorId(user.id).build();
    const finding = FindingMother.basic().withComments([comment]).build();
    await fakeFindingsRepository.save({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = AddCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId(finding.id)
      .withText('This is a new comment')
      .withUser(user)
      .build();

    await useCase.addComment(input);

    const findingWithComment = await fakeFindingsRepository.get({
      assessmentId: input.assessmentId,
      organizationDomain: user.organizationDomain,
      findingId: input.findingId,
    });
    expect(findingWithComment).toBeDefined();
    expect(findingWithComment?.comments).toBeDefined();
    expect(
      findingWithComment?.comments?.find((c) => c.id === comment.id),
    ).toBeDefined();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    useCase: new AddCommentUseCaseImpl(),
    fakeFindingsRepository: inject(tokenFakeFindingsRepository),
  };
};
