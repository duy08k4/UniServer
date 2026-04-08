import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFieldScoreForm1775482230662 implements MigrationInterface {
    name = 'UpdateFieldScoreForm1775482230662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_forms" ALTER COLUMN "open_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "score_forms" ALTER COLUMN "close_at" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_forms" ALTER COLUMN "close_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "score_forms" ALTER COLUMN "open_at" SET NOT NULL`);
    }

}
