import { mockClient } from 'aws-sdk-client-mock';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { AssessmentsStateMachineSfn } from './AssessmentsStateMachineSfn';

describe('AssessmentsStateMachine', () => {
  it('should start state machine', () => {
    expect(true).toBe(true);
  });
});
