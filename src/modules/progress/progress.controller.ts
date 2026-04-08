import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProgressService } from "./progress.service";
import { RoleGuard } from "../auth/role.guard";
import { AuthGuard } from "../auth/auth.guard";
import { MilestonePaginationDTO, NewMilestoneDTO, NewProgressDTO, ProgressPaginationDTO, UpdateProgressDTO } from "./progress.dto";
import { Roles } from "src/decorators/roles.decorator";
import { MainRole } from "src/enums/enums";
import { CLASS_MEMBERSHIP_REQUIRED_403 } from "./progress.err";

@ApiTags("Progress")
@Controller('progress')
@ApiResponse({ status: 403,
    description: 'Truy cập bị từ chối (Forbidden)',
    content: {
        'application/json': {
            examples: {
                'Hệ thống': {
                    value: {
                        statusCode: 403,
                        message: 'Forbidden resource',
                        error: 'Forbidden'
                    },
                }
            }
        }
    }
})
@UseGuards(AuthGuard, RoleGuard)
export class ProgressController {
    constructor(private readonly progressService: ProgressService) { }

    // -------------------------------------------------------- PROGRESS --------------------------------------------------------------------
    // Get all progresses (pagination)
    @Get('pagination')
    @ApiOperation({ summary: "Only system admin" })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiResponse({
        status: 200,
        description: 'Lấy dữ liệu thành công',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '6971b69e-2f5b-4250-987b-9fc710ec7c91' },
                            label: { type: 'string', example: 'Quy trình của Lớp học gì đó' },
                            description: { type: 'string', example: 'Mô với chả tả' },
                            is_submitted: { type: 'boolean', example: false },
                            is_deleted: { type: 'boolean', example: false },
                            is_banned: { type: 'boolean', example: false },
                            created_approval: { type: 'boolean', example: false },
                            created_at: { type: 'string', format: 'date-time', example: '2026-04-05T14:33:19.000Z' },
                            updated_at: { type: 'string', format: 'date-time', example: '2026-04-05T14:33:23.000Z' },
                            createdBy: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde2' },
                                    full_name: { type: 'string', example: 'Nguyen Van A' },
                                    email: { type: 'string', example: 'duytran.290804@gmail.com' }
                                }
                            },
                            class: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '0c71dd63-6fa0-47c3-89a2-9257aba36112' },
                                    join_code: { type: 'string', example: 'V0hYDX' },
                                    label: { type: 'string', example: 'Lớp học Gì đó' },
                                    subject: { type: 'string', example: 'Hệ thống thông tin' }
                                }
                            },
                            milestones: { type: 'number', example: 0 }
                        }
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', example: '1' },
                        size: { type: 'number', example: '2' },
                        total_progress: { type: 'number', example: 1 },
                        total_page: { type: 'number', example: 1 }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (Data is invalid)' })
    @ApiResponse({ status: 403, description: 'Truy cập bị từ chối (Access denied)' })
    async progressPagination(@Query() query: ProgressPaginationDTO, @Req() req: Request) {
        return this.progressService.progressPagination(query, req)
    }

    // Get one progress
    @Get()
    @ApiOperation({ summary: "Get one class" })
    @ApiQuery({ name: 'classId', type: String, required: true })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiResponse({
        status: 200,
        description: 'Lấy dữ liệu tiến trình thành công',
        schema: {
            type: 'object',
            example: {
                id: "48c6e841-dc49-4d95-a26d-0a96663d7f3a",
                label: "Tên quy trình",
                description: "Mô tả quy trình",
                is_submitted: false,
                is_deleted: false,
                is_banned: false,
                created_approval: false,
                created_at: "2026-04-05T09:46:56.671Z",
                updated_at: "2026-04-05T09:46:56.671Z",
                createdBy: {
                    id: "ef7c680f-a1a9-4d8d-b926-564d39b954fd",
                    full_name: "Nguyen Van B",
                    email: "22166013@st.hcmuaf.edu.vn"
                },
                class: {
                    id: "b9cd4053-8fc5-4c87-baf2-aedc8fa0f527",
                    join_code: "kxrxCy",
                    label: "Lớp học thử gì gì đó á",
                    subject: "Môn ABC_XYZ"
                },
                milestones: [
                    {
                        id: "618281ce-deb3-4c79-9b96-1272e4571135",
                        index: 1,
                        label: "Cột mốc 1",
                        description: "Mô tả cột mốc",
                        is_deleted: false,
                        is_stopped: false,
                        updated_at: "2026-04-05T13:34:43.000Z",
                        created_at: "2026-04-05T13:34:41.000Z"
                    }
                ]
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Progress not found' })
    async getOneProgress(@Query() query: { classId: string }, @Req() req: Request) {
        return this.progressService.getOneProgress(query, req)
    }

    // Create a new progress (Only one progress in a class)
    @Post('new')
    @ApiOperation({ summary: "Create a new progress. Only one progress in a class" })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiResponse({
        status: 201,
        description: 'The progress has been successfully created.',
        schema: {
            example: {
                id: "48c6e841-dc49-4d95-a26d-0a96663d7f3a",
                label: "Tên quy trình",
                description: "Mô tả quy trình",
                is_submitted: false,
                is_deleted: false,
                created_approval: false,
                created_at: "2026-04-05T09:46:56.671Z",
                updated_at: "2026-04-05T09:46:56.671Z",
                createdBy: {
                    id: "ef7c680f-a1a9-4d8d-b926-564d39b954fd",
                    full_name: "Nguyen Van B",
                    email: "22166013@st.hcmuaf.edu.vn"
                },
                class: {
                    id: "b9cd4053-8fc5-4c87-baf2-aedc8fa0f527",
                    join_code: "kxrxCy",
                    label: "Lớp học thử gì gì đó á",
                    subject: "Môn ABC_XYZ"
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Data is invalid' })
    @ApiResponse({ status: 403, description: 'Class is inactive/banned or insufficient permissions' })
    @ApiResponse({ status: 409, description: 'One progress is already existed in the class' })
    async createNewProgress(@Body() newProgressDTO: NewProgressDTO, @Req() req: Request) {
        return this.progressService.createNewProgress(newProgressDTO, req)
    }

    // Update progress
    @Put('update')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiResponse({
        status: 200,
        description: 'Lấy dữ liệu tiến trình thành công',
        schema: {
            type: 'object',
            example: {
                id: "48c6e841-dc49-4d95-a26d-0a96663d7f3a",
                label: "Tên quy trình",
                description: "Mô tả quy trình",
                is_submitted: false,
                is_deleted: false,
                is_banned: false,
                created_approval: false,
                created_at: "2026-04-05T09:46:56.671Z",
                updated_at: "2026-04-05T09:46:56.671Z",
                createdBy: {
                    id: "ef7c680f-a1a9-4d8d-b926-564d39b954fd",
                    full_name: "Nguyen Van B",
                    email: "22166013@st.hcmuaf.edu.vn"
                },
                class: {
                    id: "b9cd4053-8fc5-4c87-baf2-aedc8fa0f527",
                    join_code: "kxrxCy",
                    label: "Lớp học thử gì gì đó á",
                    subject: "Môn ABC_XYZ"
                },
                milestones: [
                    {
                        id: "618281ce-deb3-4c79-9b96-1272e4571135",
                        index: 1,
                        label: "Cột mốc 1",
                        description: "Mô tả cột mốc",
                        is_deleted: false,
                        is_stopped: false,
                        updated_at: "2026-04-05T13:34:43.000Z",
                        created_at: "2026-04-05T13:34:41.000Z"
                    }
                ]
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Data is invalid' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Progress not found' })
    async updateProgress(@Body() updateProgressDTO: UpdateProgressDTO, @Req() req: Request) {
        return this.progressService.updateProgress(updateProgressDTO, req)
    }

    // Remove progress (only single)
    @Delete('remove')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiResponse({
        status: 200,
        description: 'Xử lý xóa thành công. Phân loại rõ ràng cái nào xóa cứng, cái nào xóa mềm.',
        schema: {
            type: 'object',
            properties: {
                hard_deleted: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Danh sách các ID đã bị xóa vĩnh viễn khỏi database',
                    example: ['934ff54a-47be-429b-8c22-60441fe5c5d5']
                },
                soft_deleted: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Danh sách các ID chỉ bị đánh dấu is_deleted = true (do có dữ liệu quan trọng)',
                    example: ['198a59ec-44e9-46f3-82ac-7aa4d226eb38']
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Data is invalid' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiQuery({
        name: 'ids',
        type: [String],
        required: true,
        explode: true
    })
    async removeProgress(@Query('ids') ids: string | string[], @Req() req: Request) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return this.progressService.removeProgress(idArray, req)
    }


    // -------------------------------------------------------- MILESTONE --------------------------------------------------------------------
    // Get all milestones (pagination)
    @Get('milestone/pagination')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiResponse({
        status: 200,
        description: 'Lấy danh sách Milestone thành công',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'ae41463c-47f1-4d67-b180-a328f58274f2' },
                            index: { type: 'number', example: 1 },
                            label: { type: 'string', example: 'Xóa mềm' },
                            description: { type: 'string', example: 'true' },
                            is_deleted: { type: 'boolean', example: false },
                            is_stopped: { type: 'boolean', example: false },
                            updated_at: { type: 'string', example: '2026-04-06T14:47:47.821Z' },
                            created_at: { type: 'string', example: '2026-04-06T14:47:47.821Z' },
                            progress: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '198a59ec-44e9-46f3-82ac-7aa4d226eb38' },
                                    label: { type: 'string', example: 'Xóa mềm' },
                                    description: { type: 'string', example: '' },
                                    created_at: { type: 'string', example: '2026-04-06T14:46:58.448Z' },
                                },
                            },
                        },
                    },
                },
                pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', example: 1 },
                        size: { type: 'number', example: 5 },
                        total_progress: { type: 'number', example: 1 },
                        total_page: { type: 'number', example: 1 },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Data is invalid' })
    @ApiResponse({
        status: 403,
        description: 'Truy cập bị từ chối (Forbidden)',
        content: {
            'application/json': {
                examples: {
                    'Hệ thống': {
                        value: {
                            statusCode: 403,
                            message: 'Forbidden resource',
                            error: 'Forbidden'
                        },
                        description: 'Lỗi 403 mặc định của hệ thống'
                    },
                    'Check if the client is a member': {
                        value: CLASS_MEMBERSHIP_REQUIRED_403,
                        description: 'Lỗi khi user không thuộc lớp học này'
                    }
                }
            }
        }
    })

    async milestonePagination(@Query() query: MilestonePaginationDTO, @Req() req: Request) {
        return this.progressService.milestonePagination(query, req)
    }

    // Get one milestone (get detail)
    @Get('milestone')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiQuery({ name: 'classId', type: String, required: true })
    @ApiQuery({ name: 'milestoneId', type: String, required: true })
    @ApiResponse({
        status: 200,
        description: 'Trả về dữ liệu chi tiết cột mốc thành công.',
        content: {
            'application/json': {
                example: {
                    id: "fd13d3f5-af07-44a5-aeb7-310530b180a7",
                    index: 2,
                    label: "Cột mốc 1 đổi thành",
                    description: "Giai đoạn 1",
                    is_deleted: false,
                    is_stopped: false,
                    updated_at: "2026-04-07T06:49:43.594Z",
                    created_at: "2026-04-07T06:47:15.267Z",
                    forms: [
                        {
                            id: "7a7e664b-3acf-4112-ab5b-29c40165d8b6",
                            is_join_form: false,
                            label: "Form name",
                            description: null,
                            field_count: 1,
                            is_auto_open: false,
                            is_auto_close: false,
                            email_notification_enabled: true,
                            is_deleted: false,
                            is_stopped: false,
                            open_at: null,
                            close_at: null,
                            update_at: "2026-04-07T10:42:11.743Z",
                            created_at: "2026-04-07T10:42:11.743Z"
                        }
                    ],
                    scoreForms: [
                        {
                            id: "242ac4f4-1623-49e7-a85c-73ceb9f9e381",
                            score_form_type: "supervisor_score",
                            status: "accept",
                            label: "Xóa mềm",
                            description: null,
                            field_count: 1,
                            is_auto_open: false,
                            is_auto_close: false,
                            email_notification_enabled: true,
                            is_deleted: false,
                            is_stopped: false,
                            open_at: null,
                            close_at: null,
                            created_at: "2026-04-06T14:49:40.574Z",
                            update_at: "2026-04-06T14:49:40.574Z"
                        }
                    ]
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Data is invalid' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Milestone not found' })
    async getOneMilestone(@Query() query: { milestoneId: string, classId: string }, @Req() req: Request) {
        return this.progressService.getMilestone(query, req)
    }

    // Create a new milestone
    @Post('milestone/new')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiBody({
        type: NewMilestoneDTO,
        description: "List of milestones"
    })
    @ApiResponse({
        status: 201,
        description: 'Cập nhật và thêm mới Milestone thành công.',
        schema: {
            type: 'object',
            properties: {
                updated: {
                    type: 'array',
                    items: { type: 'object' },
                },
                added: {
                    type: 'array',
                    items: { type: 'object' },
                },
            },
            example: {
                updated: [
                    {
                        id: "fd13d3f5-af07-44a5-aeb7-310530b180a7",
                        label: "Cột mốc 1 đổi thành 2",
                        index: 2,
                        description: "Giai đoạn 1",
                        createdBy: "539573b3-e15c-4722-83a9-76ae0da2d6ac",
                        progress: {
                            id: "198a59ec-44e9-46f3-82ac-7aa4d226eb38",
                            label: "Xóa mềm",
                            description: "",
                            is_deleted: false,
                            is_submitted: false,
                            is_banned: false,
                            created_approval: false,
                            created_at: "2026-04-06T14:46:58.448Z",
                            updated_at: "2026-04-06T15:23:11.506Z",
                            createdBy: {
                                id: "ef7c680f-a1a9-4d8d-b926-564d39b954fd",
                                full_name: "Nguyen Van B",
                                email: "22166013@st.hcmuaf.edu.vn"
                            },
                            class: {
                                id: "b9cd4053-8fc5-4c87-baf2-aedc8fa0f527",
                                join_code: "kxrxCy",
                                label: "Lớp học thử gì gì đó á",
                                subject: "Môn ABC_XYZ"
                            },
                            milestones: [
                                {
                                    id: "ae41463c-47f1-4d67-b180-a328f58274f2",
                                    index: 1,
                                    label: "Xóa mềm",
                                    description: "true",
                                    is_deleted: false,
                                    is_stopped: false,
                                    updated_at: "2026-04-06T14:47:47.821Z",
                                    created_at: "2026-04-06T14:47:47.821Z"
                                }
                            ]
                        }
                    }
                ],
                added: []
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Data is invalid' })
    @ApiResponse({ status: 403, description: 'Access denied' })

    async createNewMilestone(@Body() milestones: NewMilestoneDTO, @Req() req: Request) {
        return this.progressService.createNewMilestone(milestones, req)
    }

    // Update milestone
    @Put('milestone/update')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiBody({
        type: NewMilestoneDTO,
        description: "List of milestones"
    })
    async updateMilestone(@Body() milestones: NewMilestoneDTO, @Req() req: Request) {
        return this.progressService.updateMilestones(milestones, req)
    }

    // Remove milestone (single or multi)
    @Delete('milestone/remove')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiQuery({
        name: 'ids',
        type: [String],
        required: true,
        explode: true
    })
    async removeMilestone(@Query('ids') ids: string | string[], @Req() req: Request) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return this.progressService.removeMilestones(idArray, req)
    }
}