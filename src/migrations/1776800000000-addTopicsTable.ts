import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTopicsTable1776800000000 implements MigrationInterface {
    name = 'AddTopicsTable1776800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."topics_thesis_type_enum" AS ENUM('thesis', 'capstone'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."topics_status_enum" AS ENUM('draft', 'invited', 'supervisor_rejected', 'supervisor_accepted', 'outline_pending', 'outline_rejected', 'approved'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

        // Bảng topics
        await queryRunner.query(`
            CREATE TABLE "topics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" character varying DEFAULT NULL,
                "thesis_type" "public"."topics_thesis_type_enum" NOT NULL,
                "status" "public"."topics_status_enum" NOT NULL DEFAULT 'draft',
                "rejection_note" character varying DEFAULT NULL,
                "outline_file_url" character varying DEFAULT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "milestone_id" uuid,
                "student_id" uuid,
                "supervisor_id" uuid,
                CONSTRAINT "PK_topics" PRIMARY KEY ("id")
            )
        `);

        // Unique: 1 SV chỉ có 1 topic trong 1 milestone
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_topics_milestone_student" ON "topics" ("milestone_id", "student_id")`);

        // Foreign keys
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_topics_milestone" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_topics_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_topics_supervisor" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL`);

        // Thêm cột is_registration_milestone vào milestones
        await queryRunner.query(`ALTER TABLE "milestones" ADD "is_registration_milestone" boolean NOT NULL DEFAULT false`);

        // Thêm 2 giá trị mới vào Field_Label enum
        await queryRunner.query(`ALTER TYPE "public"."fields_label_enum" ADD VALUE IF NOT EXISTS 'supervisor_review_file'`);
        await queryRunner.query(`ALTER TYPE "public"."fields_label_enum" ADD VALUE IF NOT EXISTS 'revision_file'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "milestones" DROP COLUMN "is_registration_milestone"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_topics_supervisor"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_topics_student"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_topics_milestone"`);
        await queryRunner.query(`DROP INDEX "IDX_topics_milestone_student"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP TYPE "public"."topics_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."topics_thesis_type_enum"`);
    }
}
