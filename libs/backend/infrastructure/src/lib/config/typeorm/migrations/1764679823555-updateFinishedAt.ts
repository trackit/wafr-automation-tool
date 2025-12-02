import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFinishedAt1764679823555 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE assessments 
      SET "finishedAt" = "createdAt" 
      WHERE "finishedAt" IS NULL 
      AND "createdAt" < '2025-10-28'::timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE assessments 
      SET "finishedAt" = NULL 
      WHERE "finishedAt" = "createdAt"
      AND "createdAt" < '2025-10-28'::timestamp
    `);
  }
}
