import { MigrationInterface, QueryRunner } from "typeorm";

export class SetRelationSubmissionCheckboxesCheckboxFieldChoice1776177473223 implements MigrationInterface {
    name = 'SetRelationSubmissionCheckboxesCheckboxFieldChoice1776177473223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" DROP CONSTRAINT "FK_739f9f6f4d288f71eb7f0e088ef"`);
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" DROP COLUMN "submission_checkbox"`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" ADD "fieldChoicesId" uuid`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" DROP CONSTRAINT "FK_bcbf5c36305327a549d3cc9d489"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c2a3a815fd83a20958e863a92"`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" DROP CONSTRAINT "REL_2d43b289afe25e6542ffe01b75"`);
        await queryRunner.query(`CREATE INDEX "IDX_4c2a3a815fd83a20958e863a92" ON "submission_checkboxes" ("checkbox_field", "submission") `);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" ADD CONSTRAINT "FK_bcbf5c36305327a549d3cc9d489" FOREIGN KEY ("checkbox_field") REFERENCES "checkbox_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" ADD CONSTRAINT "FK_58ee14800951f128a5afbcd9e82" FOREIGN KEY ("fieldChoicesId") REFERENCES "checkbox_field_choices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" DROP CONSTRAINT "FK_58ee14800951f128a5afbcd9e82"`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" DROP CONSTRAINT "FK_bcbf5c36305327a549d3cc9d489"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c2a3a815fd83a20958e863a92"`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" ADD CONSTRAINT "REL_2d43b289afe25e6542ffe01b75" UNIQUE ("checkbox_field")`);
        await queryRunner.query(`CREATE INDEX "IDX_4c2a3a815fd83a20958e863a92" ON "submission_checkboxes" ("checkbox_field", "submission") `);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" ADD CONSTRAINT "FK_bcbf5c36305327a549d3cc9d489" FOREIGN KEY ("checkbox_field") REFERENCES "checkbox_fields"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submission_checkboxes" DROP COLUMN "fieldChoicesId"`);
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" ADD "submission_checkbox" uuid`);
        await queryRunner.query(`ALTER TABLE "checkbox_field_choices" ADD CONSTRAINT "FK_739f9f6f4d288f71eb7f0e088ef" FOREIGN KEY ("submission_checkbox") REFERENCES "submission_checkboxes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
