import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { SubmissionController } from "./submissions.controller";
import { SubmissionService } from "./submissions.service";
import { Forms } from "src/entities/forms.en";
import { Fields } from "src/entities/fields.en";
import { Checkbox_fields } from "src/entities/checkbox_fields.en";
import { CheckboxFieldChoices } from "src/entities/checkbox_field_choices.en";
import { Submissions } from "src/entities/submissions.en";
import { Users } from "src/entities/user.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Topics } from "src/entities/topics.en";
import { Milestones } from "src/entities/milestones.en";
import { MailService } from "../notifications/mail.service";

@Module({
    imports: [
        ConfigModule,
        AuthModule,
        TypeOrmModule.forFeature([Forms, Fields, Checkbox_fields, CheckboxFieldChoices, Submissions, Users, ClassMembers, Topics, Milestones])
    ],
    controllers: [SubmissionController],
    providers: [SubmissionService, MailService],
    exports: []
})
export class SubmissionsModule { }
