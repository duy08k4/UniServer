import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatefieldFields1776401819956 implements MigrationInterface {
    name = 'UpdatefieldFields1776401819956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkbox_fields" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "fields" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fields" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "checkbox_fields" DROP COLUMN "is_deleted"`);
    }

}
