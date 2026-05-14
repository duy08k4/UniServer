import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReviewerTopics1778570283513 implements MigrationInterface {
    name = 'UpdateReviewerTopics1778570283513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "topics" ADD "reviewer_id" uuid; EXCEPTION WHEN duplicate_column THEN null; END $$;`);
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "topics" ADD CONSTRAINT "FK_a551b55572c5ba803a708ac2802" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_a551b55572c5ba803a708ac2802"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "reviewer_id"`);
    }

}
