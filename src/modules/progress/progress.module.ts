import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Progresses } from "src/entities/progresses.en";
import { AuthModule } from "../auth/auth.module";
import { Users } from "src/entities/user.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Classes } from "src/entities/classes.en";
import { Milestones } from "src/entities/milestones.en";

// Entity

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Users, Progresses, Classes, ClassMembers, Milestones])],
    controllers: [ProgressController],
    providers: [ProgressService],
    exports: []
})
export class ProgressModule {  }