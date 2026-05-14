import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFILENAMEcolumnSubmissionAnswers1777379878460 implements MigrationInterface {
    name = 'AddFILENAMEcolumnSubmissionAnswers1777379878460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "submission_answers" ADD "file_name" character varying; EXCEPTION WHEN duplicate_column THEN null; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submission_answers" DROP COLUMN "file_name"`);
    }

}
