import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FormsController } from "./forms.controller";
import { FormsService } from "./forms.service";
import { Users } from "src/entities/user.en";
import { AuthModule } from "../auth/auth.module";
import { Forms } from "src/entities/forms.en";
import { Fields } from "src/entities/fields.en";
import { Checkbox_fields } from "src/entities/checkbox_fields.en";
import { CheckboxFieldChoices } from "src/entities/checkbox_field_choices.en";
import { Classes } from "src/entities/classes.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Milestones } from "src/entities/milestones.en";
import { Notifications } from "src/entities/notifications.en";
import { Submissions } from "src/entities/submissions.en";
import { FormsGateway } from "./forms.gateway";

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([
            Forms, Fields, Checkbox_fields, CheckboxFieldChoices, Submissions,
            Classes, ClassMembers, Milestones, Notifications, Users
        ])
    ],
    controllers: [FormsController],
    providers: [FormsService, FormsGateway],
    exports: []
})
export class FormsModule { }
