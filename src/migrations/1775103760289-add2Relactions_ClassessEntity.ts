import { MigrationInterface, QueryRunner } from "typeorm";

export class Add2RelactionsClassessEntity1775103760289 implements MigrationInterface {
    name = 'Add2RelactionsClassessEntity1775103760289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forms" ADD "class" uuid`);
        await queryRunner.query(`ALTER TABLE "score_forms" ADD "class" uuid`);
        await queryRunner.query(`ALTER TABLE "forms" ADD CONSTRAINT "FK_2c6d9d9d7e2ef39e207a24f707b" FOREIGN KEY ("class") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_forms" ADD CONSTRAINT "FK_fcbd1d8b1cb4297ff9522265356" FOREIGN KEY ("class") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_forms" DROP CONSTRAINT "FK_fcbd1d8b1cb4297ff9522265356"`);
        await queryRunner.query(`ALTER TABLE "forms" DROP CONSTRAINT "FK_2c6d9d9d7e2ef39e207a24f707b"`);
        await queryRunner.query(`ALTER TABLE "score_forms" DROP COLUMN "class"`);
        await queryRunner.query(`ALTER TABLE "forms" DROP COLUMN "class"`);
    }

}
