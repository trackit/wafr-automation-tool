import { createInjectionToken, inject } from '@shared/di-container';
import { tokenObjectsStorage, tokenS3Bucket } from '@backend/infrastructure';

import { readFileSync } from 'fs';

export interface PrepareCustodianUseCase {
  prepareCustodian(): Promise<string>;
}

export const CUSTODIAN_FILE_NAME = 'custodian.yml';

export class PrepareCustodianUseCaseImpl implements PrepareCustodianUseCase {
  private readonly objectStorage = inject(tokenObjectsStorage);
  private readonly s3Bucket = inject(tokenS3Bucket);

  public getPolicies(): string {
    return readFileSync('./policies/policies.yml', 'utf8');
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
