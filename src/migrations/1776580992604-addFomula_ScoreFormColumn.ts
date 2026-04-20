import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFomulaScoreFormColumn1776580992604 implements MigrationInterface {
    name = 'AddFomulaScoreFormColumn1776580992604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_forms" DROP COLUMN "email_notification_enabled"`);
        await queryRunner.query(`ALTER TABLE "score_form_columns" ADD "formula_content" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_form_columns" DROP COLUMN "formula_content"`);
        await queryRunner.query(`ALTER TABLE "score_forms" ADD "email_notification_enabled" boolean NOT NULL DEFAULT true`);
    }

}
