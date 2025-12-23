import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddBillingInformationEntity1762536816940
  implements MigrationInterface
{
  name = 'AddBillingInformationEntity1762536816940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "billingInformation" ("assessmentId" uuid NOT NULL, "billingPeriodStartDate" TIMESTAMP WITH TIME ZONE NOT NULL, "billingPeriodEndDate" TIMESTAMP WITH TIME ZONE NOT NULL, "totalCost" character varying NOT NULL, "servicesCost" jsonb, CONSTRAINT "PK_2df313749dfbe081b68a1b2fe3e" PRIMARY KEY ("assessmentId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "billingInformation" ADD CONSTRAINT "FK_2df313749dfbe081b68a1b2fe3e" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billingInformation" DROP CONSTRAINT "FK_2df313749dfbe081b68a1b2fe3e"`,
    );
    await queryRunner.query(`DROP TABLE "billingInformation"`);
  }
}
