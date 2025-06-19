import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

import { ObjectsStorage } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import { tokenLogger } from '../Logger';

export class ObjectsStorageS3 implements ObjectsStorage {
  private readonly client = inject(tokenClientS3);
  private readonly logger = inject(tokenLogger);
  private readonly bucket = inject(tokenS3Bucket);

  public async list(args: { prefix: string }): Promise<string[]> {
    const { prefix } = args;
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });
    try {
      const response = await this.client.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error(
          `Failed to list objects: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info(`Listing objects: ${prefix}`);
      return response.Contents?.map((content) => content.Key as string) ?? [];
    } catch (error) {
      this.logger.error(`Failed to list objects: ${error}`, prefix);
      throw error;
    }
  }

  public async bulkDelete(args: { keys: string[] }): Promise<void> {
    const { keys } = args;
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });
    try {
      const response = await this.client.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error(
          `Failed to delete objects: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info(`Deleted objects: ${keys}`);
    } catch (error) {
      this.logger.error(`Failed to delete objects: ${error}`, keys);
      throw error;
    }
  }
}

export const tokenObjectsStorage = createInjectionToken<ObjectsStorage>(
  'ObjectsStorage',
  {
    useClass: ObjectsStorageS3,
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
