import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommitteesService } from "./committees.service";
import { UpsertCommitteeDTO } from "./committees.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "src/decorators/roles.decorator";
import { MainRole } from "src/enums/enums";

@ApiTags("Committees")
@Controller('committees')
@UseGuards(AuthGuard, RoleGuard)
@Roles(MainRole.USER, MainRole.UNIADMIN)
export class CommitteesController {
    constructor(private readonly committeesService: CommitteesService) { }

    @Post()
    upsert(@Body() dto: UpsertCommitteeDTO, @Req() req: Request) {
        return this.committeesService.upsert(dto, req)
    }

    @Get(':classId')
    getByClassId(@Param('classId') classId: string, @Req() req: Request) {
        return this.committeesService.getByClassId(classId, req)
    }

    @Delete(':id')
    deleteById(@Param('id') id: string, @Req() req: Request) {
        return this.committeesService.deleteById(id, req)
    }
}
