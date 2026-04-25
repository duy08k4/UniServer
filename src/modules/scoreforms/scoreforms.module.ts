import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ScoreFormsController } from "./scoreforms.controller";
import { ScoreFormsService } from "./scoreforms.service";
import { ScoreFormsGateway } from "./scoreforms.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScoreForms } from "src/entities/score_forms.en";
import { ScoreFormColumns } from "src/entities/score_form_columns.en";
import { ScoreFormRows } from "src/entities/score_form_rows.en";
import { ScoreFormCells } from "src/entities/score_form_cells.en";
import { Users } from "src/entities/user.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Classes } from "src/entities/classes.en";
import { Topics } from "src/entities/topics.en";
import { CommitteeMembers } from "src/entities/committee_members.en";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Users, ScoreForms, ScoreFormColumns, ScoreFormRows, ScoreFormCells, ClassMembers, Classes, Topics, CommitteeMembers])],
    providers:[ScoreFormsService, ScoreFormsGateway],
    controllers: [ScoreFormsController],
    exports: [ScoreFormsService, ScoreFormsGateway]
})
export class ScoreFormsModule { }