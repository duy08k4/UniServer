import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnLabel1776800000006 implements MigrationInterface {
    name = 'AddColumnLabel1776800000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "column_label_enum" AS ENUM ('last_name', 'first_name')
        `);

        await queryRunner.query(`
            ALTER TABLE "score_form_columns"
            ADD COLUMN "column_label" "column_label_enum" DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_form_columns" DROP COLUMN "column_label"`);
        await queryRunner.query(`DROP TYPE "column_label_enum"`);
    }
}
