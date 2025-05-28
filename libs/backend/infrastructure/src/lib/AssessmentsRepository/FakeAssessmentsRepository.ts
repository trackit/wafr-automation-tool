import type { Assessment, Finding } from '@backend/models';
import type { AssessmentsRepository } from '@backend/ports';

export class FakeAssessmentsRepository implements AssessmentsRepository {
  public assessments: Record<string, Assessment> = {};
  public assessmentFindings: Record<string, Finding[]> = {};

  public async save(args: {
    assessment: Assessment;
    organization: string;
  }): Promise<Assessment> {
    const { assessment, organization } = args;
    const key = `${assessment.id}#${organization}`;
    this.assessments[key] = assessment;

    if (!this.assessmentFindings[key]) {
      this.assessmentFindings[key] = [];
    }

    return assessment;
  }

  public async getOne(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organization } = args;
    return this.assessments[`${assessmentId}#${organization}`];
  }

  public async delete(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    delete this.assessments[`${assessmentId}#${organization}`];
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    const { assessmentId, organization } = args;
    delete this.assessmentFindings[`${assessmentId}#${organization}`];
  }
}
