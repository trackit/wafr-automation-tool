import {
  type BillingInformation,
  type ServiceCost,
} from './BillingInformation';

export class BillingInformationMother {
  private data: BillingInformation;

  private constructor(data: BillingInformation) {
    this.data = data;
  }

  public static basic(): BillingInformationMother {
    return new BillingInformationMother({
      billingPeriodStartDate: new Date('2025-08-01'),
      billingPeriodEndDate: new Date('2025-08-31'),
      totalCost: '12345.67',
      servicesCost: [
        { serviceName: 'Amazon EC2', cost: '5400.12' },
        { serviceName: 'Amazon S3', cost: '3120.50' },
        { serviceName: 'AWS Lambda', cost: '1200.00' },
      ],
    });
  }

  public withBillingPeriodStartDate(
    billingPeriodStartDate: string,
  ): BillingInformationMother {
    this.data.billingPeriodStartDate = new Date(billingPeriodStartDate);
    return this;
  }

  public withBillingPeriodEndDate(
    billingPeriodEndDate: string,
  ): BillingInformationMother {
    this.data.billingPeriodEndDate = new Date(billingPeriodEndDate);
    return this;
  }

  public withServicesCost(
    servicesCost: ServiceCost[],
  ): BillingInformationMother {
    this.data.servicesCost = servicesCost;
    return this;
  }

  public withTotalCost(totalCost: string): BillingInformationMother {
    this.data.totalCost = totalCost;
    return this;
  }

  public build(): BillingInformation {
    return this.data;
  }
}
