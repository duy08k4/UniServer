import { MigrationInterface, QueryRunner } from "typeorm";

export class EditRole1774182722681 implements MigrationInterface {
    name = 'EditRole1774182722681'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_members" DROP CONSTRAINT "CHK_ec10dbcedee355426237c12b4f"`);
        await queryRunner.query(`ALTER TYPE "public"."class_members_role_enum" RENAME TO "class_members_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."class_members_role_enum" AS ENUM('roomadmin', 'student', 'lecturer')`);
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "role" TYPE "public"."class_members_role_enum" USING "role"::"text"::"public"."class_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "role" SET DEFAULT 'student'`);
        await queryRunner.query(`DROP TYPE "public"."class_members_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'uniadmin')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('user', 'uniadmin', 'roomadmin', 'student', 'lecturer')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."class_members_role_enum_old" AS ENUM('user', 'uniadmin', 'roomadmin', 'student', 'lecturer')`);
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "role" TYPE "public"."class_members_role_enum_old" USING "role"::"text"::"public"."class_members_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "class_members" ALTER COLUMN "role" SET DEFAULT 'student'`);
        await queryRunner.query(`DROP TYPE "public"."class_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."class_members_role_enum_old" RENAME TO "class_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "class_members" ADD CONSTRAINT "CHK_ec10dbcedee355426237c12b4f" CHECK ((role = ANY (ARRAY['roomadmin'::class_members_role_enum, 'student'::class_members_role_enum, 'lecturer'::class_members_role_enum])))`);
    }

}
