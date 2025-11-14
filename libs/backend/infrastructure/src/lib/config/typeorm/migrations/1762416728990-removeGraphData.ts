import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGraphData1762416728990 implements MigrationInterface {
  name = 'RemoveGraphData1762416728990';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "rawGraphData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessments" DROP COLUMN "graphData"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessments" ADD "graphData" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "assessments" ADD "rawGraphData" jsonb`,
    );
  }
}
