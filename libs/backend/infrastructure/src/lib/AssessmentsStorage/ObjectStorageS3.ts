import {
  DeleteObjectCommand,
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';

import { ObjectStorage } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { format } from 'util';
import { tokenLogger } from '../Logger';

export const ASSESSMENTS_PATH = 'assessments/%s';

export class ObjectStorageS3 implements ObjectStorage {
  private readonly client = inject(tokenClientS3);
  private readonly logger = inject(tokenLogger);
  private readonly bucket = inject(tokenS3Bucket);

  public async delete(assessmentId: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: format(ASSESSMENTS_PATH, assessmentId),
    });
    try {
      const response = await this.client.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error(
          `Failed to delete assessment: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info(`Assessment deleted: ${assessmentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete assessment: ${error}`, assessmentId);
      throw error;
    }
  }

  public async put(args: { key: string; body: string }): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: args.key,
      Body: args.body,
    });
    try {
      const response = await this.client.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error(
          `Failed to put object: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info(`Object succesfuly added: ${args.key}`);
    } catch (error) {
      this.logger.error(`Failed to put object: ${error}`, args.key);
      throw error;
    }
  }
}

export const tokenObjectStorage = createInjectionToken<ObjectStorage>(
  'ObjectStorage',
  {
    useClass: ObjectStorageS3,
  }
);

export const tokenClientS3 = createInjectionToken<S3Client>('ClientS3', {
  useClass: S3Client,
});

export const tokenS3Bucket = createInjectionToken<string>('S3Bucket', {
  useFactory: () => {
    const bucket = process.env.S3_BUCKET;
    assertIsDefined(bucket, 'S3_BUCKET is not defined');
    return bucket;
  },
});
