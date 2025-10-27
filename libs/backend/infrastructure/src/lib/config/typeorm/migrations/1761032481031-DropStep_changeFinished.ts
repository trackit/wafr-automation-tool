import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropStepChangeFinished1761032481031 implements MigrationInterface {
  name = 'DropStepChangeFinished1761032481031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "step"`);
    await queryRunner.query(`DROP TYPE "public"."assessments_step_enum"`);
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "finished"`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "finishedAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "finishedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "finished" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assessments_step_enum" AS ENUM('SCANNING_STARTED', 'PREPARING_ASSOCIATIONS', 'ASSOCIATING_FINDINGS', 'FINISHED', 'ERRORED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "step" "public"."assessments_step_enum" NOT NULL`,
    );
  }
}
