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

import { FindingNotFoundError } from '../../errors/FindingErrors';
import { AddCommentUseCaseImpl } from './AddCommentUseCase';
import { AddCommentUseCaseArgsMother } from './AddCommentUseCaseArgsMother';

describe('AddCommentUseCase', () => {
  it('should throw a FindingNotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [];

    const input = AddCommentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
      .withFindingId('scanning-tool#finding-id')
      .withUser(UserMother.basic().withOrganizationDomain('test.io').build())
      .build();

    await expect(useCase.addComment(input)).rejects.toThrow(
      FindingNotFoundError
    );
  });

  it('should add the comment', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    fakeAssessmentsRepository.assessmentFindings['assessment-id#test.io'] = [
      FindingMother.basic()
        .withId('scanning-tool#12345')
        .withComments([
          FindingCommentMother.basic()
            .withAuthorId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
            .withId('comment-id')
            .build(),
        ])
        .build(),
    ];

    const input = AddCommentUseCaseArgsMother.basic()
      .withAssessmentId('assessment-id')
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
      'assessment-id#test.io'
    ].find((finding) => finding.id === 'scanning-tool#12345');
    expect(finding).toBeDefined();
    expect(finding?.comments).toBeDefined();
    expect(finding?.comments?.find((c) => c.id === 'comment-id')).toBeDefined();
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
