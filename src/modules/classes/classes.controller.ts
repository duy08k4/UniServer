import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

// Decorator
import { Roles } from "src/decorators/roles.decorator";

// DTO
import { ApprovedClassDTO, CreateClassDTO, GetClassDTO, JoinClassDTO, RemoveClassDTO, RemoveMemberDTO, UpdateClassDTO, UpdateCommitteeDTO } from "./classes.dto";
import { MainRole, Role, RoomRole } from "src/enums/enums";

// Guard
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";

// Service
import { ClassesService } from "./classes.service";

@ApiTags("Class")
@Controller("classes")
@UseGuards(AuthGuard, RoleGuard)
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    // Approve class creation
    @Get('approved')
    @ApiOperation({ summary: 'Approve a newly created class' })
    @ApiQuery({ name: 'classId', type: String, description: 'ID of the class to approve' })
    @ApiResponse({ status: 200, description: 'Class approved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @Roles(Role.UNIADMIN)
    async approveNewClass(@Query() query: ApprovedClassDTO) {
        return await this.classesService.approveNewClass(query.classId);
    }

    // Get class
    @Get()
    @ApiOperation({ summary: 'Get classes for render' })
    @ApiResponse({
        status: 200,
        description: 'Thành công',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '262cb2d1-d0cd-451b-9474-5c9453c9335f' },
                            join_code: { type: 'string', example: 'GRebRc' },
                            label: { type: 'string', example: 'Lớp Công nghệ phần mềm 2' },
                            description: { type: 'string', example: 'string' },
                            subject: { type: 'string', example: 'Software Engineering' },
                            created_approval: { type: 'boolean', example: false },
                            required_join_form: { type: 'boolean', example: true },
                            required_approval: { type: 'boolean', example: true },
                            is_banned: { type: 'boolean', example: false },
                            is_deleted: { type: 'boolean', example: false },
                            created_at: { type: 'string', example: '2026-03-24T19:25:04.545Z' },
                            createdby: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde2' },
                            counts: {
                                type: 'object',
                                properties: {
                                    student: { type: 'number', example: 0 },
                                    lecturer: { type: 'number', example: 0 },
                                    committee: { type: 'number', example: 0 }
                                }
                            }
                        }
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', example: 1 },
                        size: { type: 'number', example: 20 },
                        total_classes: { type: 'number', example: 1 },
                        totalPage: { type: 'number', example: 0 }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Roles(Role.UNIADMIN, Role.USER)
    async getClass(@Query() query: GetClassDTO, @Req() req: Request) {
        return this.classesService.getClass(query, req)
    }

    // Create a new class
    @Post('new')
    @ApiOperation({ summary: 'Create a new class' })
    @ApiBody({ type: CreateClassDTO })
    @ApiResponse({
        status: 201,
        description: 'Success',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Success'
                },
                data: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '6914cc08-1753-4863-be11-e2346fcfdaae' },
                        join_code: { type: 'string', example: 'wQ9_R5' },
                        label: { type: 'string', example: 'Lớp Công nghệ phần mềm' },
                        description: { type: 'string', example: 'string' },
                        subject: { type: 'string', example: 'Software Engineering' },
                        created_approval: { type: 'boolean', example: false },
                        required_approval: { type: 'boolean', example: false },
                        required_join_form: { type: 'boolean', example: false },
                        is_deleted: { type: 'boolean', example: false },
                        is_banned: { type: 'boolean', example: false },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-24T06:49:30.451Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2026-03-24T06:49:30.451Z' },
                        createdBy: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde4' },
                                full_name: { type: 'string', example: 'Nguyen Van A' },
                                email: { type: 'string', example: 'duytran.290804@gmail.com' },
                                role: { type: 'string', example: 'uniadmin' }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async createNewClass(@Body() createClassDto: CreateClassDTO, @Req() req: any) {
        return this.classesService.createNewClass(createClassDto)
    }

    // Join to a class
    @Post('join')
    @ApiOperation({ summary: 'Join a class using a code or class ID' })
    @ApiBody({ type: JoinClassDTO })
    @ApiResponse({ status: 200, description: 'Joined class successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'Class not found' })
    @ApiResponse({ status: 409, description: 'User already in class' })
    async joinClass(@Body() joinClassDto: JoinClassDTO) {
        return this.classesService.joinClass(joinClassDto)
    }

    // Add committee
    @Put('committee/update')
    @ApiOperation({ summary: 'Join a class using a code or class ID' })
    @ApiBody({ type: UpdateCommitteeDTO })
    @ApiResponse({ status: 200, description: 'Joined class successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'Class not found' })
    @ApiResponse({ status: 409, description: 'User is a committee' })
    @ApiResponse({ status: 422, description: 'Role must be LECTURER' })
    async updateCommittee(@Body() updateCommitteeDto: UpdateCommitteeDTO) {
        return this.classesService.updateCommittee(updateCommitteeDto)
    }

    // Update some information in class
    @Put()
    @ApiOperation({ summary: 'Update class information' })
    @ApiBody({ type: UpdateClassDTO })
    @ApiResponse({ status: 200, description: 'Class updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    async updateClass(@Body() query: UpdateClassDTO) {
        return this.classesService.updateClass(query)
    }

    // Remove a class
    @Delete()
    @ApiOperation({ summary: 'Remove a class' })
    @ApiResponse({ status: 200, description: 'Class removed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    async removeClass(@Query() query: RemoveClassDTO) {
        return this.classesService.removeClass(query)
    }

    // Remove a class
    @Delete('member')
    @ApiOperation({ summary: 'Remove a class' })
    @ApiResponse({ status: 200, description: 'Class removed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async removeMember(@Query() query: RemoveMemberDTO, @Req() req: Request) {
        return this.classesService.removeMember(query, req)
    }
}
