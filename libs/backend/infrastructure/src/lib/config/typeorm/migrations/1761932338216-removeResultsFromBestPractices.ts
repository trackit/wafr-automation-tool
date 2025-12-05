import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RemoveResultsFromBestPractices1761932338216
  implements MigrationInterface
{
  name = 'RemoveResultsFromBestPractices1761932338216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bestPractices" DROP COLUMN "results"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bestPractices" ADD "results" character varying array NOT NULL DEFAULT '{}'`,
    );
  }
}
