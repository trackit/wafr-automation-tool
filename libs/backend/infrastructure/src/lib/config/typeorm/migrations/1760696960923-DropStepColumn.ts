import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropStepColumn1760696960923 implements MigrationInterface {
  name = 'DropStepColumn1760696960923';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "step"`);
    await queryRunner.query(`DROP TYPE "public"."assessments_step_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."assessments_step_enum" AS ENUM('SCANNING_STARTED', 'PREPARING_ASSOCIATIONS', 'ASSOCIATING_FINDINGS', 'FINISHED', 'ERRORED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "step" "public"."assessments_step_enum" NOT NULL`,
    );
  }
}
