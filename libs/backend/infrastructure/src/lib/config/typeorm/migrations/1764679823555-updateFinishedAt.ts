import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFinishedAt1764679823555 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE assessments 
      SET "finishedAt" = "createdAt" 
      WHERE "finishedAt" IS NULL 
      AND "createdAt" < NOW() - INTERVAL '1 day'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE assessments 
      SET "finishedAt" = NULL 
      WHERE "finishedAt" IS NOT NULL 
      AND "finishedAt" = "createdAt"
      AND "finishedAt" > NOW() - INTERVAL '1 hour'
    `);
  }
}
