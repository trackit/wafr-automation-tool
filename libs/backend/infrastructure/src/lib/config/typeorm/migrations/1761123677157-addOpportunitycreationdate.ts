import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpportunitycreationdate1761123677157
  implements MigrationInterface
{
  name = 'AddOpportunitycreationdate1761123677157';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "opportunityCreatedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_opportunity_created_at" ON "assessments" ("opportunityCreatedAt") WHERE "opportunityCreatedAt" IS NOT NULL AND "opportunityId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_opportunity_created_at"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "opportunityCreatedAt"`,
    );
  }
}
