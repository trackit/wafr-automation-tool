import type { Assessment, Finding } from '@backend/models';
import type { AssessmentsRepository } from '@backend/ports';

export class FakeAssessmentsRepository implements AssessmentsRepository {
  public assessments: Record<string, Assessment> = {};
  public assessmentFindings: Record<string, Finding[]> = {};

  public async save(assessment: Assessment): Promise<void> {
    const key = `${assessment.id}#${assessment.organization}`;
    this.assessments[key] = assessment;

    if (!this.assessmentFindings[key]) {
      this.assessmentFindings[key] = [];
    }
  }

  public async saveFinding(args: {
    assessmentId: string;
    organization: string;
    finding: Finding;
  }): Promise<void> {
    const { assessmentId, organization, finding } = args;
    const key = `${assessmentId}#${organization}`;

    if (!this.assessmentFindings[key]) {
      this.assessmentFindings[key] = [];
    }

    this.assessmentFindings[key].push(finding);
  }

  public async getOne(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined> {
    const { assessmentId, organization } = args;
    return this.assessments[`${assessmentId}#${organization}`];
  }

  public async getOneFinding(args: {
    assessmentId: string;
    findingId: string;
    organization: string;
  }): Promise<Finding | undefined> {
    const { assessmentId, findingId, organization } = args;
    const key = `${assessmentId}#${organization}`;
    return this.assessmentFindings[key]?.find(
      (finding) => finding.id === findingId
    );
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
