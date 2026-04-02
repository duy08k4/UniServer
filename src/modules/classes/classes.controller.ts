import { Body, Controller, Delete, Get, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

// Decorator
import { Roles } from "src/decorators/roles.decorator";

// DTO
import { ApprovedClassDTO, CreateClassDTO, GetClassDTO, GetMembersDTO, JoinClassDTO, RemoveClassDTO, RemoveMemberDTO, UpdateClassDTO, UpdateCommitteeDTO, updateMemberInClassDTO } from "./classes.dto";
import { MainRole, Role } from "src/enums/enums";

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

    // Get classes
    @Get('all')
    @ApiOperation({ summary: 'Get classes for render' })
    @ApiResponse({
        status: 200,
        description: 'Example paginated class list with createdBy and owner',
        schema: {
            example: {
                data: [
                    {
                        id: '98dfcd84-cb7b-49ad-9083-98f8e7230dfd',
                        join_code: 'imyzvX',
                        label: 'Lớp Công nghệ phần mềm',
                        description: 'string',
                        subject: 'Software Engineering',
                        created_approval: false,
                        required_join_form: false,
                        required_approval: false,
                        is_banned: false,
                        is_deleted: false,
                        created_at: '2026-03-26T01:29:35.354Z',
                        updated_at: '2026-03-26T02:14:00.348Z',
                        user: {
                            role: "student",
                            is_banned: false,
                            roomadmin_approved: true
                        },
                        createdBy: {
                            id: 'd5105d88-d54c-463f-a24e-52c92921dde2',
                            full_name: 'Nguyen Van A',
                            email: 'duytran.290804@gmail.com',
                            role: 'user'
                        },
                        counts: {
                            student: 0,
                            lecturer: 0,
                            committee: 0,
                            pending: 0
                        },
                        owner: {
                            full_name: 'Nguyen Van A',
                            email: 'duytran.290804@gmail.com'
                        }
                    }
                ],
                pagination: {
                    page: 1,
                    size: 20,
                    total_classes: 1,
                    totalPage: 0
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async getClass(@Query() query: GetClassDTO, @Req() req: Request) {
        return this.classesService.getClass(query, req)
    }

    // Get a class
    @Get('one')
    @ApiOperation({ summary: 'Get data of one class' })
    @ApiQuery({ name: 'classId', type: String, description: 'ID of the class' })
    @ApiResponse({
        status: 200,
        description: 'Example paginated class list with createdBy and owner',
        schema: {
            example: {
                id: '98dfcd84-cb7b-49ad-9083-98f8e7230dfd',
                join_code: 'imyzvX',
                label: 'Lớp Công nghệ phần mềm',
                description: 'string',
                subject: 'Software Engineering',
                created_approval: false,
                required_join_form: false,
                required_approval: false,
                is_banned: false,
                is_deleted: false,
                created_at: '2026-03-26T01:29:35.354Z',
                updated_at: '2026-03-26T02:14:00.348Z',
                user: {
                    role: "student",
                    is_banned: false,
                    roomadmin_approved: true
                },
                createdBy: {
                    id: 'd5105d88-d54c-463f-a24e-52c92921dde2',
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com',
                    role: 'user'
                },
                counts: {
                    student: 0,
                    lecturer: 0,
                    committee: 0,
                    pending: 0
                },
                owner: {
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com'
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'Class not found' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async getOneClass(@Query() query: { classId: string }, @Req() req: Request) {
        return await this.classesService.getOneClass(query, req);
    }

    // Get member
    @Get('/members')
    @ApiOperation({ summary: "Get member of one class. Get all members without class's ID" })
    @ApiQuery({ name: 'classId', type: String, description: 'ID of the class' })
    @ApiResponse({
        status: 200,
        description: 'Trả về dữ liệu thành viên thành công (Hard-coded)',
        content: {
            'application/json': {
                example: {
                    data: {
                        lecturer: [],
                        student: [],
                        roomadmin: [
                            {
                                id: "02c4d4a0-83f4-47ac-b39a-e1d2523fd428",
                                role: "roomadmin",
                                roomadmin_approved: true,
                                is_banned: false,
                                is_committee_member: false,
                                can_create_notifications: true,
                                can_create_forms: true,
                                can_create_score_forms: true,
                                joined_at: "2026-03-28T05:40:14.291Z",
                                updated_at: "2026-03-28T05:40:14.291Z",
                                created_at: "2026-03-28T05:40:14.291Z",
                                user: {
                                    id: "d5105d88-d54c-463f-a24e-52c92921dde2",
                                    full_name: "Nguyen Van A",
                                    email: "duytran.290804@gmail.com"
                                }
                            }
                        ],
                        pending: [
                            {
                                id: "68593bfe-5375-42cc-816e-b213eb15f1f1",
                                role: "student",
                                roomadmin_approved: false,
                                is_banned: false,
                                is_committee_member: false,
                                can_create_notifications: false,
                                can_create_forms: false,
                                can_create_score_forms: false,
                                joined_at: "2026-03-29T11:46:58.000Z",
                                updated_at: "2026-03-29T11:46:56.000Z",
                                created_at: "2026-03-29T11:46:52.000Z",
                                user: {
                                    id: "ef7c680f-a1a9-4d8d-b926-564d39b954fd",
                                    full_name: "Nguyen Van B",
                                    email: "22166013@st.hcmuaf.edu.vn"
                                }
                            }
                        ]
                    },
                    pagination: {
                        page: 1,
                        size: 10,
                        total_members: 2,
                        totalPage: 1
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'Class not found' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async getMember(@Query() query: GetMembersDTO, @Req() req: Request) {
        return await this.classesService.getMember(query, req);
    }

    // Create a new class
    @Post('new')
    @ApiOperation({ summary: 'Create a new class' })
    @ApiBody({ type: CreateClassDTO })
    @ApiResponse({
        status: 201,
        description: 'Class created successfully',
        schema: {
            example: {
                id: '30593d7c-74e9-4d6c-9476-ac5fa779d449',
                join_code: '93Bh4D',
                label: 'Lớp Công nghệ phần mềm',
                description: 'string',
                subject: 'Software Engineering',
                created_approval: false,
                required_approval: false,
                required_join_form: false,
                is_deleted: false,
                is_banned: false,
                created_at: '2026-03-26T02:14:00.348Z',
                updated_at: '2026-03-26T02:14:00.348Z',
                user: {
                    role: "student",
                    is_banned: false,
                    roomadmin_approved: true
                },
                createdBy: {
                    id: 'd5105d88-d54c-463f-a24e-52c92921dde2',
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com',
                    role: 'uniadmin'
                },
                counts: {
                    student: 0,
                    lecturer: 0,
                    committee: 0,
                    pending: 0
                },
                owner: {
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com'
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async createNewClass(@Body() createClassDto: CreateClassDTO, @Req() req: any) {
        return this.classesService.createNewClass(createClassDto, req)
    }

    // Join to a class
    @Post('join')
    @ApiOperation({ summary: 'Join a class using a code or class ID' })
    @ApiBody({ type: JoinClassDTO })
    @ApiResponse({
        status: 201,
        description: 'Class created successfully',
        schema: {
            example: {
                id: '30593d7c-74e9-4d6c-9476-ac5fa779d449',
                join_code: '93Bh4D',
                label: 'Lớp Công nghệ phần mềm',
                description: 'string',
                subject: 'Software Engineering',
                created_approval: false,
                required_approval: false,
                required_join_form: false,
                is_deleted: false,
                is_banned: false,
                created_at: '2026-03-26T02:14:00.348Z',
                updated_at: '2026-03-26T02:14:00.348Z',
                user: {
                    role: "student",
                    is_banned: false,
                    roomadmin_approved: true
                },
                createdBy: {
                    id: 'd5105d88-d54c-463f-a24e-52c92921dde2',
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com',
                    role: 'uniadmin'
                },
                counts: {
                    student: 0,
                    lecturer: 0,
                    committee: 0,
                    pending: 0
                },
                owner: {
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com'
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'Class not found' })
    @ApiResponse({ status: 409, description: 'User already in class' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async joinClass(@Body() joinClassDto: JoinClassDTO, @Req() req: Request) {
        return this.classesService.joinClass(joinClassDto, req)
    }

    // Update some information in class
    @Put()
    @ApiOperation({ summary: 'Update class information' })
    @ApiBody({ type: UpdateClassDTO })
    @ApiResponse({
        status: 200,
        description: 'Example paginated class list with createdBy and owner',
        schema: {
            example: {
                id: '98dfcd84-cb7b-49ad-9083-98f8e7230dfd',
                join_code: 'imyzvX',
                label: 'Lớp Công nghệ phần mềm',
                description: 'string',
                subject: 'Software Engineering',
                created_approval: false,
                required_join_form: false,
                required_approval: false,
                is_banned: false,
                is_deleted: false,
                created_at: '2026-03-26T01:29:35.354Z',
                updated_at: '2026-03-26T02:14:00.348Z',
                user: {
                    role: "student",
                    is_banned: false,
                    roomadmin_approved: true
                },
                createdBy: {
                    id: 'd5105d88-d54c-463f-a24e-52c92921dde2',
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com',
                    role: 'user'
                },
                counts: {
                    student: 0,
                    lecturer: 0,
                    committee: 0,
                    pending: 0
                },
                owner: {
                    full_name: 'Nguyen Van A',
                    email: 'duytran.290804@gmail.com'
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async updateClass(@Body() query: UpdateClassDTO, @Req() req: Request) {
        return this.classesService.updateClass(query, req)
    }

    // Update member
    @Put('member/update')
    @ApiOperation({ summary: "Get member of one class. Get all members without class's ID" })
    @ApiResponse({
        status: 200,
        description: 'Successful Response',
        content: {
            'application/json': {
                example: {
                    id: "68593bfe-5375-42cc-816e-b213eb15f1f1",
                    role: "student",
                    roomadmin_approved: true,
                    is_banned: false,
                    is_committee_member: false,
                    can_create_notifications: false,
                    can_create_forms: false,
                    can_create_score_forms: false,
                    joined_at: "2026-03-29T11:46:58.000Z",
                    updated_at: "2026-03-30T04:45:12.477Z",
                    created_at: "2026-03-29T11:46:52.000Z",
                    user: {
                        id: "ef7c680f-a1a9-4d8d-b926-564d39b954fd",
                        full_name: "Nguyen Van B",
                        email: "22166013@st.hcmuaf.edu.vn"
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @ApiResponse({ status: 404, description: 'Class not found' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async updateMember(@Body() query: updateMemberInClassDTO, @Req() req: Request) {
        return await this.classesService.updateMemberInClass(query, req);
    }

    // Remove a class
    @Delete()
    @ApiOperation({ summary: 'Remove a class' })
    @ApiResponse({ status: 200, description: 'Class removed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    async removeClass(@Query() query: RemoveClassDTO, @Req() req: Request) {
        return this.classesService.removeClass(query, req)
    }

    // Remove a member
    @Delete('member')
    @ApiOperation({ summary: 'Remove a member' })
    @ApiResponse({ status: 200, description: 'Class removed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Session expired' })
    @ApiResponse({ status: 403, description: 'Forbidden - Access denied' })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    async removeMember(@Query() query: RemoveMemberDTO, @Req() req: Request) {
        return this.classesService.removeMember(query, req)
    }
}
