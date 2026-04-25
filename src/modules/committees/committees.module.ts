import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Committees } from "src/entities/committees.en";
import { CommitteeMembers } from "src/entities/committee_members.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Topics } from "src/entities/topics.en";
import { CommitteesController } from "./committees.controller";
import { CommitteesService } from "./committees.service";

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Committees, CommitteeMembers, ClassMembers, Topics])],
    controllers: [CommitteesController],
    providers: [CommitteesService],
    exports: [TypeOrmModule],
})
export class CommitteesModule { }
