import { AIFinding } from './AI';

export class AIFindingMother {
  private data: AIFinding;

  private constructor(data: AIFinding) {
    this.data = data;
  }

  public static basic(): AIFindingMother {
    return new AIFindingMother({
      id: '1',
      statusDetail: 'status-detail',
      riskDetails: 'risk-details',
    });
  }

  public withId(id: string): AIFindingMother {
    this.data.id = id;
    return this;
  }

  public withStatusDetail(statusDetail: string): AIFindingMother {
    this.data.statusDetail = statusDetail;
    return this;
  }

  public withRiskDetails(riskDetails: string): AIFindingMother {
    this.data.riskDetails = riskDetails;
    return this;
  }

  public build(): AIFinding {
    return this.data;
  }
}
