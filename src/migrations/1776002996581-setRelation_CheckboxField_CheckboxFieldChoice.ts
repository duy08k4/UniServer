import { MigrationInterface, QueryRunner } from "typeorm";

export class SetRelationCheckboxFieldCheckboxFieldChoice1776002996581 implements MigrationInterface {
    name = 'SetRelationCheckboxFieldCheckboxFieldChoice1776002996581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" ADD "checkboxFieldId" uuid`);
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" ADD CONSTRAINT "FK_d7a6c1aa7753c672fd97b66ed17" FOREIGN KEY ("checkboxFieldId") REFERENCES "checkbox_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" DROP CONSTRAINT "FK_d7a6c1aa7753c672fd97b66ed17"`);
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" DROP COLUMN "checkboxFieldId"`);
    }

}
