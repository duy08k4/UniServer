import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommittees1776800000005 implements MigrationInterface {
    name = 'AddCommittees1776800000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`
            CREATE TYPE "committee_role_enum" AS ENUM ('chairman', 'reviewer', 'member', 'secretary')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "column_allowed_role_enum" AS ENUM ('roomadmin', 'lecturer', 'chairman', 'reviewer', 'member')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "column_type_enum" AS ENUM ('normal', 'component', 'summary')
        `);

        // Create committees table
        await queryRunner.query(`
            CREATE TABLE "committees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "class_id" uuid NOT NULL,
                "milestone_id" uuid NOT NULL,
                CONSTRAINT "PK_committees" PRIMARY KEY ("id")
            )
        `);

        // Create committee_members table
        await queryRunner.query(`
            CREATE TABLE "committee_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "role" "committee_role_enum" NOT NULL,
                "committee_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                CONSTRAINT "PK_committee_members" PRIMARY KEY ("id")
            )
        `);

        // Add columns to score_form_columns
        await queryRunner.query(`
            ALTER TABLE "score_form_columns" 
            ADD COLUMN "allowed_role" "column_allowed_role_enum" DEFAULT NULL,
            ADD COLUMN "column_type" "column_type_enum" NOT NULL DEFAULT 'normal'
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_committees_class" ON "committees" ("class_id")
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_committee_members_committee_user" ON "committee_members" ("committee_id", "user_id")
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "committees" 
            ADD CONSTRAINT "FK_committees_class" 
            FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "committees" 
            ADD CONSTRAINT "FK_committees_milestone" 
            FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "committee_members" 
            ADD CONSTRAINT "FK_committee_members_committee" 
            FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "committee_members" 
            ADD CONSTRAINT "FK_committee_members_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "committee_members" DROP CONSTRAINT "FK_committee_members_user"`);
        await queryRunner.query(`ALTER TABLE "committee_members" DROP CONSTRAINT "FK_committee_members_committee"`);
        await queryRunner.query(`ALTER TABLE "committees" DROP CONSTRAINT "FK_committees_milestone"`);
        await queryRunner.query(`ALTER TABLE "committees" DROP CONSTRAINT "FK_committees_class"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_committee_members_committee_user"`);
        await queryRunner.query(`DROP INDEX "IDX_committees_class"`);

        // Remove columns from score_form_columns
        await queryRunner.query(`ALTER TABLE "score_form_columns" DROP COLUMN "column_type"`);
        await queryRunner.query(`ALTER TABLE "score_form_columns" DROP COLUMN "allowed_role"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "committee_members"`);
        await queryRunner.query(`DROP TABLE "committees"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "column_type_enum"`);
        await queryRunner.query(`DROP TYPE "column_allowed_role_enum"`);
        await queryRunner.query(`DROP TYPE "committee_role_enum"`);
    }
}
