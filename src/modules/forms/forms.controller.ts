import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FormsPaginationDTO, GetFormDetailDTO, NewFormDTO, ToggleStopDTO } from "./forms.dto";
import { FormsService } from "./forms.service";
import { MainRole } from "src/enums/enums";
import { Roles } from "src/decorators/roles.decorator";

@ApiTags("Form")
@Controller("form")
@UseGuards(AuthGuard, RoleGuard)
export class FormsController {
    constructor(
        private readonly formsService: FormsService
    ) { }
    // Get all forms (pagination) (Only admin users)
    @Get('pagination')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Trả về danh sách dữ liệu kèm phân trang',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '08750903-f56c-460b-bb98-151b9ce66803' },
                            is_join_form: { type: 'boolean', example: false },
                            label: { type: 'string', example: 'string' },
                            description: { type: 'string', example: 'string' },
                            field_count: { type: 'number', example: 2 },
                            is_auto_open: { type: 'boolean', example: false },
                            is_auto_close: { type: 'boolean', example: false },
                            is_deleted: { type: 'boolean', example: false },
                            is_stopped: { type: 'boolean', example: false },
                            open_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                            close_at: { type: 'string', format: 'date-time', nullable: true, example: null },
                            update_at: { type: 'string', format: 'date-time', example: '2026-04-17T11:36:20.222Z' },
                            created_at: { type: 'string', format: 'date-time', example: '2026-04-17T11:36:20.222Z' },
                            createdBy: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde2' },
                                    full_name: { type: 'string', example: 'Nguyen Van A' },
                                    email: { type: 'string', example: 'duytran.290804@gmail.com' },
                                },
                            },
                            class: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '0c71dd63-6fa0-47c3-89a2-9257aba36112' },
                                    label: { type: 'string', example: 'Lớp khóa luận tốt nghiệp' },
                                },
                            },
                        },
                    },
                },
                pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 1 },
                        page: { type: 'number', example: 1 },
                        size: { type: 'number', example: 10 },
                        totalPages: { type: 'number', example: 1 },
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ (thiếu classId hoặc formId).' })
    @ApiForbiddenResponse({ description: 'Bạn không có quyền truy cập vào biểu mẫu của lớp học này.' })
    async formsPagination(@Query() query: FormsPaginationDTO, @Req() req: Request) {
        return this.formsService.formsPagination(query, req)
    }

    // Get one form (get detail)
    @Get()
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Trả về chi tiết form và thông tin lớp học thành công',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '76c56e74-0aa2-4681-b917-05d4d397b912' },
                is_join_form: { type: 'boolean', example: false },
                label: { type: 'string', example: 'Form thử nghiệm' },
                description: { type: 'string', example: 'Đây là form thử nghiệm trong quá trình dev' },
                field_count: { type: 'number', example: 2 },
                is_auto_open: { type: 'boolean', example: false },
                is_auto_close: { type: 'boolean', example: false },
                is_deleted: { type: 'boolean', example: false },
                is_stopped: { type: 'boolean', example: false },
                open_at: { type: 'string', format: 'date-time', example: null, nullable: true },
                close_at: { type: 'string', format: 'date-time', example: null, nullable: true },
                update_at: { type: 'string', format: 'date-time', example: '2026-04-14T03:43:01.166Z' },
                created_at: { type: 'string', format: 'date-time', example: '2026-04-14T03:13:45.499Z' },
                milestone: { type: 'object', example: null, nullable: true },
                notifications: {
                    type: 'array',
                    nullable: true,
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' }
                        }
                    }
                },
                createdBy: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '539573b3-e15c-4722-83a9-76ae0da2d6ac' },
                        full_name: { type: 'string', example: 'Super Admin' },
                        email: { type: 'string', example: 'abc@gmail.com' }
                    }
                },
                class: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '0c71dd63-6fa0-47c3-89a2-9257aba36112' },
                        join_code: { type: 'string', example: 'V0hYDX' },
                        label: { type: 'string', example: 'Lớp khóa luận tốt nghiệp' },
                        description: { type: 'string', example: 'Đây là lớp khóa luận tốt nghiệp...' },
                        subject: { type: 'string', example: 'Hệ thống thông tin' }
                    }
                },
                fields: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'be742b20-d50b-4611-a051-8e49c3e344be' },
                            index: { type: 'number', example: 1 },
                            label: { type: 'string', example: 'null' },
                            title: { type: 'string', example: 'string' },
                            description: { type: 'string', example: 'string' },
                            input_type: { type: 'string', example: 'string' },
                            is_required: { type: 'boolean', example: true },
                            is_deleted: { type: 'boolean', example: false },
                            unit: { type: 'string', example: 'character' },
                            max_attempts: { type: 'number', example: 200 },
                            min_attempts: { type: 'number', example: 200 },
                            update_at: { type: 'string', format: 'date-time' },
                            created_at: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                checkboxFields: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'bc17014b-925c-4fad-908a-137f61aad67e' },
                            index: { type: 'number', example: 2 },
                            title: { type: 'string', example: 'string' },
                            description: { type: 'string', example: 'string' },
                            input_type: { type: 'string', example: 'checkbox' },
                            choice_count: { type: 'number', example: 1 },
                            is_required: { type: 'boolean', example: true },
                            is_multiple: { type: 'boolean', example: false },
                            is_deleted: { type: 'boolean', example: false },
                            update_at: { type: 'string', format: 'date-time' },
                            created_at: { type: 'string', format: 'date-time' },
                            checkbox_field_choices: {
                                type: 'array', items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', example: "3dbfd348-ffa7-47fb-b626-b56f22b37732" },
                                        index: { type: 'number', example: 1 },
                                        body: { type: 'string', example: "Lựa chọn 1" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ (thiếu classId hoặc formId).' })
    @ApiForbiddenResponse({ description: 'Bạn không có quyền truy cập vào biểu mẫu của lớp học này.' })
    @ApiNotFoundResponse({ description: 'Không tìm thấy biểu mẫu yêu cầu.' })
    async getFormDetail(@Query() query: GetFormDetailDTO, @Req() req: Request) {
        return this.formsService.getFormDetail(query, req)
    }

    // Get submission
    @Get('submission')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Successfully retrieved the list of form submissions with detailed answers.',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'ab6cd087-f92f-4484-9caa-d3923f80bfcd' },
                    status: { type: 'string', example: 'pending' },
                    created_at: { type: 'string', format: 'date-time', example: '2026-04-14T13:52:06.610Z' },
                    updated_at: { type: 'string', format: 'date-time', example: '2026-04-14T13:52:06.610Z' },
                    form: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '76c56e74-0aa2-4681-b917-05d4d397b912' },
                            label: { type: 'string', example: 'Form thử nghiệm' },
                            field_count: { type: 'number', example: 2 },
                            update_at: { type: 'string', format: 'date-time' },
                            created_at: { type: 'string', format: 'date-time' },
                            createdBy: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: '539573b3-e15c-4722-83a9-76ae0da2d6ac' },
                                    full_name: { type: 'string', example: 'Super Admin' },
                                    email: { type: 'string', example: 'abc@gmail.com' }
                                }
                            }
                        }
                    },
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'd5105d88-d54c-463f-a24e-52c92921dde2' },
                            full_name: { type: 'string', example: 'Nguyen Van A' },
                            email: { type: 'string', example: 'duytran.290804@gmail.com' },
                            role: { type: 'string', example: 'user' }
                        }
                    },
                    answers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: '05fd1ea2-87fc-46e5-b30b-05b3da2a13bc' },
                                body: { type: 'string', example: 'Câu trả lời demo trong quá trình dev' }
                            }
                        }
                    },
                    checkboxes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: '64c19b65-d036-479f-a19e-5e7962fed8f8' },
                                fieldChoices: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', example: '3dbfd348-ffa7-47fb-b626-b56f22b37732' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Invalid data' })
    @ApiForbiddenResponse({ description: 'Access denied' })
    @ApiNotFoundResponse({ description: 'No submissions have been received yet' })
    async getSubmission(@Query() query: GetFormDetailDTO, @Req() req: Request) {
        return this.formsService.getSubmission(query, req)
    }

    // Update form
    @Post()
    @ApiOperation({ summary: "Create and update" })
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiCreatedResponse({
        description: 'Cập nhật hoặc tạo mới Form thành công.',
        content: {
            'application/json': {
                example: {
                    id: "76c56e74-0aa2-4681-b917-05d4d397b912",
                    is_join_form: false,
                    label: "Form thử nghiệm",
                    description: "Đây là form thử nghiệm trong quá trình dev",
                    field_count: 2,
                    is_auto_open: false,
                    is_auto_close: false,
                    is_deleted: false,
                    is_stopped: false,
                    open_at: null,
                    close_at: null,
                    update_at: "2026-04-14T03:43:01.166Z",
                    created_at: "2026-04-14T03:13:45.499Z",
                    milestone: null,
                    notifications: [],
                    fields: [
                        {
                            id: "be742b20-d50b-4611-a051-8e49c3e344be",
                            index: 1,
                            label: "null",
                            title: "string",
                            description: "string",
                            input_type: "string",
                            is_deleted: false,
                            is_required: true,
                            unit: "character",
                            max_attempts: 200,
                            min_attempts: 200,
                            update_at: "2026-04-14T03:43:01.166Z",
                            created_at: "2026-04-14T03:13:45.499Z"
                        }
                    ],
                    checkboxFields: [
                        {
                            id: "bc17014b-925c-4fad-908a-137f61aad67e",
                            index: 2,
                            title: "string",
                            description: "string",
                            input_type: "checkbox",
                            choice_count: 1,
                            is_required: true,
                            is_deleted: false,
                            is_multiple: false,
                            update_at: "2026-04-14T03:43:01.166Z",
                            created_at: "2026-04-14T03:13:45.499Z",
                            checkbox_field_choices: [
                                {
                                    id: "55546d82-e6a0-4d52-a675-d705085ac1c7",
                                    index: 1,
                                    body: "string"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Dữ liệu đầu vào sai định dạng hoặc vi phạm logic nghiệp vụ.',
        content: {
            'application/json': {
                examples: {
                    invalid_uuid: { summary: 'Sai định dạng UUID', value: { message: 'Invalid ID format: [id]', error: 'Bad Request', statusCode: 400 } },
                    invalid_data: { summary: 'Thiếu thông tin bắt buộc', value: { message: 'Invalid basic data', error: 'Bad Request', statusCode: 400 } },
                    time_error: { summary: 'Sai logic thời gian', value: { message: 'Open time must be before close time', error: 'Bad Request', statusCode: 400 } },
                    index_error: { summary: 'Sai thứ tự index', value: { message: 'Field indices must be continuous and unique', error: 'Bad Request', statusCode: 400 } },
                }
            }
        }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Người dùng không có quyền thực hiện hành động này.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Only UniAdmin or RoomAdmin can create/update forms',
                error: 'Forbidden'
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Not Found - Không tìm thấy Form hoặc trường dữ liệu cần cập nhật.',
        content: {
            'application/json': {
                examples: {
                    form_not_found: { summary: 'Không tìm thấy Form', value: { message: 'Form not found', error: 'Not Found', statusCode: 404 } },
                    field_not_found: { summary: 'Không tìm thấy Checkbox Field', value: { message: 'Checkbox field [id] not found', error: 'Not Found', statusCode: 404 } },
                }
            }
        }
    })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error - Lỗi hệ thống trong quá trình xử lý Database.',
    })
    async createNewForm(@Body() body: NewFormDTO, @Req() req: Request) {
        return this.formsService.updateNewForm(body, req)
    }

    // Remove form (single or multi)
    @Delete('remove')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOperation({ summary: "Remove forms (single or multi)" })
    @ApiQuery({
        name: 'ids',
        type: [String],
        required: true,
        explode: true
    })
    @ApiResponse({
        status: 200,
        description: 'Xử lý xóa thành công. Phân loại rõ ràng cái nào xóa cứng, cái nào xóa mềm.',
        schema: {
            type: 'object',
            properties: {
                deleted_ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['934ff54a-47be-429b-8c22-60441fe5c5d5']
                },
                hard_deleted: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['934ff54a-47be-429b-8c22-60441fe5c5d5']
                },
                soft_deleted: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['198a59ec-44e9-46f3-82ac-7aa4d226eb38']
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
    @ApiResponse({ status: 403, description: 'Truy cập bị từ chối.' })
    async removeForms(@Query('ids') ids: string | string[], @Req() req: Request) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return this.formsService.removeForms(idArray, req)
    }

    // Remove field (single or multi)
    @Delete('field/remove')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOperation({ summary: "Remove fields (single or multi)" })
    @ApiQuery({
        name: 'ids',
        type: [String],
        required: true,
        explode: true
    })
    @ApiResponse({
        status: 200,
        description: 'Xử lý xóa thành công. Phân loại rõ ràng cái nào xóa cứng, cái nào xóa mềm.',
        schema: {
            type: 'object',
            properties: {
                deleted_ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['934ff54a-47be-429b-8c22-60441fe5c5d5']
                },
                hard_deleted: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['934ff54a-47be-429b-8c22-60441fe5c5d5']
                },
                soft_deleted: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['198a59ec-44e9-46f3-82ac-7aa4d226eb38']
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
    @ApiResponse({ status: 403, description: 'Truy cập bị từ chối.' })
    async removeFields(@Query('ids') ids: string | string[], @Req() req: Request) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return this.formsService.removeFields(idArray, req)
    }

    @Patch('toggle-stop')
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOperation({ summary: "Toggle is_stopped for a form" })
    async toggleStop(@Body() body: ToggleStopDTO, @Req() req: Request) {
        return this.formsService.toggleStop(body, req)
    }
}