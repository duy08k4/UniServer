import { Module } from "@nestjs/common";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";

// Entities
import { Users } from "src/entities/user.en";
import { Classes } from "src/entities/classes.en";
import { ClassGateway } from "./class.gateway";
import { ClassMembers } from "src/entities/class_members.en";
import { GlobalGateway } from "../socket/socketGlobal.gateway";
import { Submissions } from "src/entities/submissions.en";
import { ScoreFormCells } from "src/entities/score_form_cells.en";
import { ScoreFormsModule } from "../scoreforms/scoreforms.module";

import { Forms } from "src/entities/forms.en";

@Module({
    imports: [AuthModule, ScoreFormsModule, TypeOrmModule.forFeature([Users, Classes, ClassMembers, Submissions, ScoreFormCells, Forms])],
    controllers: [ClassesController],
    providers: [ClassesService, ClassGateway, GlobalGateway],
    exports: []
})
export class ClassesModule {}