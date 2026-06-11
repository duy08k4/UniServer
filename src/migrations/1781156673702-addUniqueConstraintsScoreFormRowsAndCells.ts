import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintsScoreFormRowsAndCells1781156673702 implements MigrationInterface {
    name = 'AddUniqueConstraintsScoreFormRowsAndCells1781156673702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5c3751f1bcb296748570b38595"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5c3751f1bcb296748570b38595" ON "score_form_rows" ("student", "score_form") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_abc7d7b7005375e9fdb20d529c" ON "score_form_cells" ("row", "column") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_abc7d7b7005375e9fdb20d529c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c3751f1bcb296748570b38595"`);
        await queryRunner.query(`CREATE INDEX "IDX_5c3751f1bcb296748570b38595" ON "score_form_rows" ("score_form", "student") `);
    }

}
