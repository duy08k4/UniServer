import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameCheckboxFieldLabelToTitle1776800000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkbox_fields" RENAME COLUMN "label" TO "title"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkbox_fields" RENAME COLUMN "title" TO "label"`);
    }
}
