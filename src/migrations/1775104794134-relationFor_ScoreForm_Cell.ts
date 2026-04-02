import { MigrationInterface, QueryRunner } from "typeorm";

export class RelationForScoreFormCell1775104794134 implements MigrationInterface {
    name = 'RelationForScoreFormCell1775104794134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_form_cells" ADD "score_form" uuid`);
        await queryRunner.query(`ALTER TABLE "score_form_cells" ALTER COLUMN "value" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "score_form_cells" ADD CONSTRAINT "FK_0afc9c7b97e1d410eadf702bde7" FOREIGN KEY ("score_form") REFERENCES "score_forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_form_cells" DROP CONSTRAINT "FK_0afc9c7b97e1d410eadf702bde7"`);
        await queryRunner.query(`ALTER TABLE "score_form_cells" ALTER COLUMN "value" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "score_form_cells" DROP COLUMN "score_form"`);
    }

}
