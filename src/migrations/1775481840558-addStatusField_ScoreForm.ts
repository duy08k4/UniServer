import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusFieldScoreForm1775481840558 implements MigrationInterface {
    name = 'AddStatusFieldScoreForm1775481840558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."score_forms_status_enum" AS ENUM('pending', 'receive', 'accept', 'reject')`);
        await queryRunner.query(`ALTER TABLE "score_forms" ADD "status" "public"."score_forms_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_forms" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."score_forms_status_enum"`);
    }

}
