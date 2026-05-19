import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { TopicsService } from "./topics.service";
import { AssignReviewerDTO, CancelInviteDTO, CreateTopicDTO, InviteSupervisorDTO, LecturerTopicQueryDTO, ReviewTopicDTO, SubmitOutlineDTO, SupervisorResponseDTO, TopicQueryDTO } from "./topics.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "src/decorators/roles.decorator";
import { MainRole } from "src/enums/enums";

@ApiTags("Topics")
@Controller('topics')
@UseGuards(AuthGuard, RoleGuard)
@Roles(MainRole.USER, MainRole.UNIADMIN)
export class TopicsController {
    constructor(private readonly topicsService: TopicsService) { }

    @Get('my')
    getMyTopics(@Query() query: LecturerTopicQueryDTO, @Req() req: Request) {
        return this.topicsService.getMyTopics(query, req)
    }

    @Get()
    getTopics(@Query() query: TopicQueryDTO, @Req() req: Request) {
        return this.topicsService.getTopics(query, req)
    }

    @Get(':id')
    getOneTopic(@Param('id') id: string, @Req() req: Request) {
        return this.topicsService.getOneTopic(id, req)
    }

    @Post('upload-outline')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
    uploadOutline(@UploadedFile() file: any, @Body('oldUrl') oldUrl: string, @Req() req: Request) {
        return this.topicsService.uploadOutlineFile(file, oldUrl, req)
    }

    @Delete('upload-outline')
    deleteOutline(@Body('url') url: string, @Req() req: Request) {
        return this.topicsService.deleteOutlineFile(url, req)
    }

    @Post()
    createTopic(@Body() dto: CreateTopicDTO, @Req() req: Request) {
        return this.topicsService.createTopic(dto, req)
    }

    @Patch(':id/invite')
    inviteSupervisor(@Param('id') id: string, @Body() dto: InviteSupervisorDTO, @Req() req: Request) {
        return this.topicsService.inviteSupervisor(id, dto, req)
    }

    @Patch(':id/cancel-invite')
    cancelInvite(@Param('id') id: string, @Body() dto: CancelInviteDTO, @Req() req: Request) {
        return this.topicsService.cancelInvite(id, dto, req)
    }

    @Patch(':id/supervisor-response')
    supervisorResponse(@Param('id') id: string, @Body() dto: SupervisorResponseDTO, @Req() req: Request) {
        return this.topicsService.supervisorResponse(id, dto, req)
    }

    @Patch(':id/submit-outline')
    submitOutline(@Param('id') id: string, @Body() dto: SubmitOutlineDTO, @Req() req: Request) {
        return this.topicsService.submitOutline(id, dto, req)
    }

    @Patch(':id/review')
    reviewTopic(@Param('id') id: string, @Body() dto: ReviewTopicDTO, @Req() req: Request) {
        return this.topicsService.reviewTopic(id, dto, req)
    }

    @Patch(':id/assign-reviewer')
    assignReviewer(@Param('id') id: string, @Body() dto: AssignReviewerDTO, @Req() req: Request) {
        return this.topicsService.assignReviewer(id, dto, req)
    }
}
