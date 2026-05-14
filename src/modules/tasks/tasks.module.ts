import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Forms } from "src/entities/forms.en";
import { ScoreForms } from "src/entities/score_forms.en";
import { FormsTaskService } from "./forms-task.service";
import { ScoreFormsTaskService } from "./scoreforms-task.service";
import { ScoreFormsModule } from "../scoreforms/scoreforms.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Forms, ScoreForms]),
        ScoreFormsModule
    ],
    providers: [FormsTaskService, ScoreFormsTaskService],
    exports: [FormsTaskService, ScoreFormsTaskService]
})
export class TasksModule { }
