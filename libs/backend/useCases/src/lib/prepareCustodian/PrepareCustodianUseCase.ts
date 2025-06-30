import {
  tokenAssessmentsStateMachine,
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NotFoundError } from '../Errors';
import { tokenObjectsStorage, tokenS3Bucket } from '@backend/infrastructure';

export interface PrepareCustodianUseCase {
  prepareCustodian(): Promise<string>;
  getPolicies(): string;
}

const policies = `policies:
  - name: ec2-stopped-instance
    resource: aws.ec2
    filters:
      - "State.Name": stopped
    actions:
      - terminate
  - name: s3-bucket-unencrypted
    resource: aws.s3
    filters:
      - type: bucket-encryption
        state: absent
    actions:
      - type: set-bucket-encryption
        crypto: AES256
`;

export const CUSTODIAN_FILE_NAME = 'custodian.yml';

export class PrepareCustodianUseCaseImpl implements PrepareCustodianUseCase {
  private readonly objectStorage = inject(tokenObjectsStorage);
  private readonly s3Bucket = inject(tokenS3Bucket);

  public getPolicies(): string {
    return policies;
  }

  public getS3Uri(): string {
    const bucket = this.s3Bucket;
    return `s3://${bucket}/${CUSTODIAN_FILE_NAME}`;
  }

  public async prepareCustodian(): Promise<string> {
    await this.objectStorage.put({
      key: CUSTODIAN_FILE_NAME,
      body: this.getPolicies(),
    });
    return this.getS3Uri();
  }
}

export const tokenPrepareCustodianUseCase =
  createInjectionToken<PrepareCustodianUseCase>('PrepareCustodianUseCase', {
    useClass: PrepareCustodianUseCaseImpl,
  });
