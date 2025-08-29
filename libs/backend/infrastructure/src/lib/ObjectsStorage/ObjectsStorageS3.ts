import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import { ObjectsStorage } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined, type Readable, streamToString } from '@shared/utils';

import { tokenLogger } from '../Logger';

export class ObjectsStorageS3 implements ObjectsStorage {
  private readonly client = inject(tokenClientS3);
  private readonly logger = inject(tokenLogger);
  private readonly bucket = inject(tokenS3Bucket);

  static getAssessmentsPath(assessmentId: string): string {
    return `assessments/${assessmentId}`;
  }

  private buildURI(key: string): string {
    return `s3://${this.bucket}/${key}`;
  }

  public async get(key: string): Promise<string | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    try {
      const response = await this.client.send(command);
      return response.Body ? streamToString(response.Body as Readable) : null;
    } catch (error: unknown) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.warn(`Object not found on S3 (key="${key}")`);
        return null;
      }
      this.logger.error(`Failed to get object: ${error}`, key);
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    try {
      const response = await this.client.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new Error(
          `Failed to delete assessment: ${response.$metadata.httpStatusCode}`
        );
      }
      this.logger.info(`Object deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete object: ${error}`, key);
      throw error;
    }
  }

  public async list(prefix: string): Promise<string[]> {
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

  public async bulkDelete(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
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

  public async put(args: { key: string; body: string }): Promise<string> {
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
      return this.buildURI(args.key);
    } catch (error) {
      this.logger.error(`Failed to put object: ${error}`, args.key);
      throw error;
    }
  }

  public parseURI(uri: string): { bucket: string; key: string } {
    const { hostname: bucket, pathname } = new URL(uri);
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    return { bucket, key };
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
