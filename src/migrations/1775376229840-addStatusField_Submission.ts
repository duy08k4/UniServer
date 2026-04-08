import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusFieldSubmission1775376229840 implements MigrationInterface {
    name = 'AddStatusFieldSubmission1775376229840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."submissions_status_enum" AS ENUM('pending', 'receive', 'accept', 'reject')`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "status" "public"."submissions_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."submissions_status_enum"`);
    }

}
