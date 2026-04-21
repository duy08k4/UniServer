import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInputTypeSubmissionAnswer1776735136853 implements MigrationInterface {
    name = 'AddInputTypeSubmissionAnswer1776735136853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."submission_answers_input_type_enum" AS ENUM('string', 'number', 'file', 'checkbox')`);
        await queryRunner.query(`ALTER TABLE "submission_answers" ADD "input_type" "public"."submission_answers_input_type_enum" NOT NULL DEFAULT 'string'`);
        await queryRunner.query(`ALTER TABLE "submission_answers" ALTER COLUMN "body" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submission_answers" ALTER COLUMN "body" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "submission_answers" DROP COLUMN "input_type"`);
        await queryRunner.query(`DROP TYPE "public"."submission_answers_input_type_enum"`);
    }

}
