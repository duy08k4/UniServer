import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards, Param } from "@nestjs/common";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ScoreFormsService } from "./scoreforms.service";
import { ScoreFormsPaginationDTO, UpdateScoreFormDTO, RemoveScoreFormsDTO, ToggleStopScoreFormDTO, ApproveScoreFormDTO } from "./scoreforms.dto";
import { RoleGuard } from "../auth/role.guard";
import { AuthGuard } from "../auth/auth.guard";
import { Roles } from "src/decorators/roles.decorator";
import { MainRole } from "src/enums/enums";

@ApiTags("ScoreForm")
@Controller('scoreforms')
@UseGuards(AuthGuard, RoleGuard)
export class ScoreFormsController {
    constructor(private readonly scoreformsService: ScoreFormsService) { }

    // Get score-form (pagination)
    @Get()
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Returns a paginated list of score forms',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '74817f4f-f0b4-4b96-8983-41f8ee55cdad' },
                            score_form_type: { type: 'string', example: 'others' },
                            label: { type: 'string', example: 'Score Form' },
                            description: { type: 'string', example: 'Description', nullable: true },
                            field_count: { type: 'number', example: 1 },
                            is_auto_open: { type: 'boolean', example: false },
                            is_auto_close: { type: 'boolean', example: false },
                            is_deleted: { type: 'boolean', example: false },
                            is_stopped: { type: 'boolean', example: false },
                            open_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                            close_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                            created_at: { type: 'string', format: 'date-time', example: '2026-04-20T03:59:21.478Z' },
                            update_at: { type: 'string', format: 'date-time', example: '2026-04-20T03:59:21.478Z' },
                            createdBy: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde2' },
                                    full_name: { type: 'string', example: 'Nguyen Van A' },
                                    email: { type: 'string', example: 'example@gmail.com' },
                                }
                            },
                            class: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '0c71dd63-6fa0-47c3-89a2-9257aba36112' },
                                    label: { type: 'string', example: 'Thesis Class' },
                                }
                            },
                        }
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 1 },
                        page: { type: 'number', example: 1 },
                        size: { type: 'number', example: 10 },
                        totalPages: { type: 'number', example: 1 },
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Missing page, size or classId (for non-UNIADMIN).' })
    @ApiForbiddenResponse({ description: 'Not a ROOMADMIN of this class.' })
    async scoreFormsPagination(@Query() query: ScoreFormsPaginationDTO, @Req() req: Request) {
        return this.scoreformsService.scoreFormsPagination(query, req)
    }

    // Get one score-form (detail)
    @Get('detail')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Returns score form detail',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '74817f4f-f0b4-4b96-8983-41f8ee55cdad' },
                score_form_type: { type: 'string', example: 'others' },
                label: { type: 'string', example: 'Score Form' },
                description: { type: 'string', nullable: true, example: null },
                field_count: { type: 'number', example: 1 },
                is_auto_open: { type: 'boolean', example: false },
                is_auto_close: { type: 'boolean', example: false },
                is_deleted: { type: 'boolean', example: false },
                is_stopped: { type: 'boolean', example: false },
                open_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                close_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                created_at: { type: 'string', format: 'date-time', example: '2026-04-20T03:59:21.478Z' },
                update_at: { type: 'string', format: 'date-time', example: '2026-04-20T03:59:21.478Z' },
                createdBy: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde2' },
                        full_name: { type: 'string', example: 'Nguyen Van A' },
                        email: { type: 'string', example: 'example@gmail.com' },
                    }
                },
                class: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '0c71dd63-6fa0-47c3-89a2-9257aba36112' },
                        join_code: { type: 'string', example: 'ABC123' },
                        label: { type: 'string', example: 'Thesis Class' },
                    }
                },
                milestone: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        id: { type: 'string', example: 'a1b2c3d4-...' },
                        label: { type: 'string', example: 'Milestone 1' },
                    }
                },
                columns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'd57027a3-1e97-42b8-81d6-e763ec00f430' },
                            label: { type: 'string', example: 'Full Name' },
                            formula_content: { type: 'string', nullable: true, example: null },
                            index: { type: 'number', example: 0 },
                        }
                    }
                }
            }
        }
    })
    @ApiNotFoundResponse({ description: 'Score form not found.' })
    @ApiForbiddenResponse({ description: 'Not a ROOMADMIN of this class.' })
    async getScoreFormDetail(@Query('id') id: string, @Req() req: Request) {
        return this.scoreformsService.getScoreFormDetail(id, req)
    }

    // Update score-form (create new and update)
    @Post()
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiCreatedResponse({
        description: 'Score form created or updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '74817f4f-f0b4-4b96-8983-41f8ee55cdad' },
                score_form_type: { type: 'string', example: 'others' },
                label: { type: 'string', example: 'Score Form' },
                description: { type: 'string', example: 'Description', nullable: true },
                field_count: { type: 'number', example: 1 },
                is_auto_open: { type: 'boolean', example: false },
                is_auto_close: { type: 'boolean', example: false },
                is_deleted: { type: 'boolean', example: false },
                is_stopped: { type: 'boolean', example: false },
                open_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                close_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                created_at: { type: 'string', format: 'date-time', example: '2026-04-20T03:59:21.478Z' },
                update_at: { type: 'string', format: 'date-time', example: '2026-04-20T03:59:21.478Z' },
                columns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'd57027a3-1e97-42b8-81d6-e763ec00f430' },
                            label: { type: 'string', example: 'Full Name' },
                            formula_content: { type: 'string', nullable: true, example: null },
                            index: { type: 'number', example: 1 },
                        }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Missing classId or invalid data.' })
    @ApiForbiddenResponse({ description: 'Only UNIADMIN or ROOMADMIN can create or update score forms.' })
    @ApiNotFoundResponse({ description: 'Score form not found (when updating).' })
    async updateScoreForm(@Body() body: UpdateScoreFormDTO, @Req() req: Request) {
        return this.scoreformsService.updateScoreForm(body, req)
    }

    // Remove score-form (single or multi)
    @Delete('soft')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({ description: 'Soft deleted successfully' })
    @ApiNotFoundResponse({ description: 'One or more score forms not found.' })
    @ApiForbiddenResponse({ description: 'Access denied.' })
    async softDeleteScoreForms(@Body() body: RemoveScoreFormsDTO, @Req() req: Request) {
        return this.scoreformsService.softDeleteScoreForms(body, req)
    }

    @Delete('hard')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({ description: 'Deleted successfully' })
    @ApiNotFoundResponse({ description: 'One or more score forms not found.' })
    @ApiForbiddenResponse({ description: 'Access denied.' })
    async hardDeleteScoreForms(@Body() body: RemoveScoreFormsDTO, @Req() req: Request) {
        return this.scoreformsService.hardDeleteScoreForms(body, req)
    }

    // Get rows + cells for a score form
    @Get('rows')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({ description: 'Returns rows with cells for a score form' })
    async getScoreFormRows(@Query('scoreFormId') scoreFormId: string, @Req() req: Request) {
        return this.scoreformsService.getScoreFormRows(scoreFormId, req)
    }

    // Remove column and row

    // Toggle stop
    @Patch('toggle-stop')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({ description: 'Toggled is_stopped successfully' })
    @ApiForbiddenResponse({ description: 'Only UniAdmin or RoomAdmin can toggle stop.' })
    @ApiNotFoundResponse({ description: 'Score form not found.' })
    async toggleStop(@Body() body: ToggleStopScoreFormDTO, @Req() req: Request) {
        return this.scoreformsService.toggleStop(body, req)
    }

    // Approve score form (SA only)
    @Patch('approve')
    @Roles(MainRole.UNIADMIN)
    @ApiOkResponse({ description: 'Score form approved successfully' })
    @ApiForbiddenResponse({ description: 'Only UniAdmin can approve.' })
    @ApiNotFoundResponse({ description: 'Score form not found.' })
    @ApiBadRequestResponse({ description: 'Score form not stopped or already approved.' })
    async approveScoreForm(@Body() body: ApproveScoreFormDTO, @Req() req: Request) {
        return this.scoreformsService.approveScoreForm(body, req)
    }

    // Update cell
    @Post('cell')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({ description: 'Cell updated successfully' })
    @ApiForbiddenResponse({ description: 'Permission denied or column has formula' })
    async updateCell(
        @Body() body: { scoreFormId: string, rowId: string, columnId: string, value: number },
        @Req() req: Request
    ) {
        return this.scoreformsService.updateCell(body.scoreFormId, body.rowId, body.columnId, body.value, req)
    }

}
