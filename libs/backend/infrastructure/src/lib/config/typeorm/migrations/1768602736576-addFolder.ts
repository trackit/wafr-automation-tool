import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFolder1768602736576 implements MigrationInterface {
    name = 'AddFolder1768602736576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessments" ADD "folder" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessments" DROP COLUMN "folder"`);
    }

}
