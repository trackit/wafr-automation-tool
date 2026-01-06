import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeFindingsRepository,
} from '@backend/infrastructure';
import {
  AssessmentMother,
  FindingCommentMother,
  FindingMother,
  UserMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  FindingCommentForbiddenError,
  FindingCommentNotFoundError,
  FindingNotFoundError,
} from '../../errors';
import { DeleteCommentUseCaseImpl } from './DeleteCommentUseCase';
import { DeleteCommentUseCaseArgsMother } from './DeleteCommentUseCaseArgsMother';

describe('DeleteCommentUseCase', () => {
  it('should throw AssessmentNotFoundError if assessment does not exist', async () => {
    const { useCase } = setup();

    const input = DeleteCommentUseCaseArgsMother.basic().build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      AssessmentNotFoundError,
    );
  });
  it('should throw FindingNotFoundError if finding does not exist', async () => {
    const { useCase, fakeAssessmentsRepository } = setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .withFindingId('scanning-tool#finding-id')
      .withUser(user)
      .build();

    await fakeAssessmentsRepository.save(assessment);
    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingNotFoundError,
    );
  });

  it('should throw FindingCommentNotFoundError if the comment does not exist in the finding', async () => {
    const { useCase, fakeFindingsRepository, fakeAssessmentsRepository } =
      setup();

    const user = UserMother.basic().build();

    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    const comment = FindingCommentMother.basic()
      .withAuthorId(user.id)
      .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
      .build();
    const finding = FindingMother.basic().withComments([comment]).build();

    await fakeAssessmentsRepository.save(assessment);
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
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
    const { useCase, fakeFindingsRepository, fakeAssessmentsRepository } =
      setup();

    const user = UserMother.basic()
      .withId('e4eaaaf2-d142-11e1-b3e4-080027620cdd')
      .build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    const comment = FindingCommentMother.basic()
      .withAuthorId('other-user-id')
      .build();
    const finding = FindingMother.basic().withComments([comment]).build();

    await fakeAssessmentsRepository.save(assessment);
    await fakeFindingsRepository.save({
      assessmentId: assessment.id,
      organizationDomain: user.organizationDomain,
      finding,
    });

    const input = DeleteCommentUseCaseArgsMother.basic()
      .withAssessmentId(assessment.id)
      .withFindingId(finding.id)
      .withCommentId(comment.id)
      .withUser(user)
      .build();

    await expect(useCase.deleteComment(input)).rejects.toThrow(
      FindingCommentForbiddenError,
    );
  });

  it('should delete the comment', async () => {
    const { useCase, fakeFindingsRepository, fakeAssessmentsRepository } =
      setup();

    const user = UserMother.basic().build();
    const assessment = AssessmentMother.basic()
      .withOrganization(user.organizationDomain)
      .build();
    const comment = FindingCommentMother.basic().withAuthorId(user.id).build();
    const finding = FindingMother.basic().withComments([comment]).build();

    await fakeAssessmentsRepository.save(assessment);
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
      version: finding.version,
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
    fakeAssessmentsRepository: inject(tokenFakeAssessmentsRepository),
  };
};
