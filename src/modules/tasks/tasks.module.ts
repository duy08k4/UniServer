import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Forms } from "src/entities/forms.en";
import { FormsTaskService } from "./forms-task.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Forms])
    ],
    providers: [FormsTaskService],
    exports: [FormsTaskService]
})
export class TasksModule { }
