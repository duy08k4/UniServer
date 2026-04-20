import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexScoreFormColumn1776601760680 implements MigrationInterface {
    name = 'AddIndexScoreFormColumn1776601760680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_form_columns" ADD "index" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_form_columns" DROP COLUMN "index"`);
    }

}
