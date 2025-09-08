import { AssociateFindingsChunkToBestPracticesInput } from './AssociateFindingsChunkToBestPracticesAdapter';

export class AssociateFindingsChunkToBestPracticesAdapterEventMother {
  private data: AssociateFindingsChunkToBestPracticesInput;

  private constructor(data: AssociateFindingsChunkToBestPracticesInput) {
    this.data = data;
  }

  public static basic(): AssociateFindingsChunkToBestPracticesAdapterEventMother {
    return new AssociateFindingsChunkToBestPracticesAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      organization: 'test.io',
      findingsChunkURI: 's3://findings-chunk-uri/prowler_0.json',
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): AssociateFindingsChunkToBestPracticesAdapterEventMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withOrganization(
    organization: string
  ): AssociateFindingsChunkToBestPracticesAdapterEventMother {
    this.data.organization = organization;
    return this;
  }

  public withFindingsChunkURI(
    findingsChunkURI: string
  ): AssociateFindingsChunkToBestPracticesAdapterEventMother {
    this.data.findingsChunkURI = findingsChunkURI;
    return this;
  }

  public build(): AssociateFindingsChunkToBestPracticesInput {
    return this.data;
  }
}
