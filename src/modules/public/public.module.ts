import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubmissionAnswers } from "@app/entities/submission_answers.en";
import { Topics } from "@app/entities/topics.en";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";

@Module({
    imports: [TypeOrmModule.forFeature([SubmissionAnswers, Topics])],
    controllers: [PublicController],
    providers: [PublicService],
})
export class PublicModule {}
