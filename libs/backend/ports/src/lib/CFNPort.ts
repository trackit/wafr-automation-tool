import { Parameter } from '@aws-sdk/client-cloudformation';

export interface CFNPort {
  addStackSetAccount(args: {
    accountId: string;
    regions: string[];
    parameterOverrides?: Parameter[];
  }): Promise<void>;
}
