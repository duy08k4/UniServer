import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { AuthGuard } from "../auth/auth.guard";
import { SubmissionService } from "./submissions.service";
import { GetSubmissionDetailDto, SubmissionPaginationDTO, UpdateSubmissionDTO } from "./submissions.dto";
import { MainRole } from "@app/enums/enums";
import { Roles } from "@app/decorators/roles.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { title } from "process";

@ApiTags("Submission")
@Controller('submission')
@UseGuards(AuthGuard, RoleGuard)
@Roles(MainRole.UNIADMIN, MainRole.USER)
export class SubmissionController {
    constructor(private readonly submissionService: SubmissionService) { }

    // Get submission (pagination)
    @Get('pagination')
    @ApiOperation({ summary: 'Get submissions with pagination' })
    @ApiOkResponse({
        description: 'Returns paginated list of submissions.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                            status: { type: 'string', example: 'pending' },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    full_name: { type: 'string' },
                                    email: { type: 'string' }
                                }
                            },
                            form: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    label: { type: 'string' }
                                }
                            },
                            class: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    label: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 20 },
                        page: { type: 'number', example: 1 },
                        size: { type: 'number', example: 10 },
                        totalPages: { type: 'number', example: 2 }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'classId is required for non-UNIADMIN roles.' })
    @ApiForbiddenResponse({ description: 'Access denied.' })
    getSubmissionsPagination(@Query() query: SubmissionPaginationDTO, @Req() req: Request) {
        return this.submissionService.getSubmissionsPagination(query, req)
    }

    // Upload file
    @Post('upload-file')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
    uploadFile(@UploadedFile() file: any, @Body('oldUrl') oldUrl: string, @Req() req: Request) {
        return this.submissionService.uploadFile(file, oldUrl, req)
    }

    // Delete file
    @Delete('remove-file')
    removeFile(@Body('urls') urls: string[]) {
        return this.submissionService.removeFiles(urls)
    }

    // Update submission
    @Post()
    @ApiOperation({ summary: 'Create or update a submission' })
    @ApiOkResponse({
        description: 'Returns submission detail.',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                status: { type: 'string', example: 'pending' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                user: { type: 'object', properties: { id: { type: 'string' }, full_name: { type: 'string' }, email: { type: 'string' } } },
                form: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } } },
                answers: {
                    type: 'array',
                    items: {
                        type: 'object', properties: {
                            id: { type: 'string' },
                            body: { type: 'string' },
                            file_name: { type: 'string', nullable: true },
                            input_type: { type: 'string' },
                            field: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } }
                        }
                    }
                },
                checkboxes: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            checkboxField: {
                                type: 'object', properties: {
                                    id: { type: 'string' },
                                    title: { type: 'string' }
                                }
                            },
                            fieldChoices: { type: 'object', properties: { id: { type: 'string' }, body: { type: 'string' } } }
                        }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Validation failed or form is not available.',
        content: {
            'application/json': {
                examples: {
                    form_stopped: {
                        summary: 'Form is closed manually',
                        value: { errorCode: 'FORM_STOPPED', message: 'Form đã đóng', statusCode: 400 }
                    },
                    form_not_opened: {
                        summary: 'Form is not yet opened',
                        value: { errorCode: 'FORM_NOT_OPENED', message: 'Form chưa đến thời gian mở', statusCode: 400 }
                    },
                    form_expired: {
                        summary: 'Form has expired',
                        value: { errorCode: 'FORM_EXPIRED', message: 'Form đã hết hạn nộp', statusCode: 400 }
                    },
                    field_required: {
                        summary: 'Required field is missing',
                        value: { errorCode: 'FIELD_REQUIRED', message: "Trường 'Tên trường' là bắt buộc", statusCode: 400 }
                    },
                    body_required: {
                        summary: 'Body content is required',
                        value: { errorCode: 'BODY_REQUIRED', message: 'Vui lòng nhập nội dung cho trường này', statusCode: 400 }
                    },
                    file_required: {
                        summary: 'File upload is required',
                        value: { errorCode: 'FILE_REQUIRED', message: 'Vui lòng tải lên file cho trường này', statusCode: 400 }
                    }
                }
            }
        }
    })
    @ApiForbiddenResponse({
        description: 'Access denied or requirements not met.',
        content: {
            'application/json': {
                examples: {
                    not_class_member: {
                        summary: 'User is not a member of the class',
                        value: { errorCode: 'NOT_CLASS_MEMBER', message: 'Bạn không phải là thành viên của lớp này', statusCode: 403 }
                    },
                    topic_not_approved: {
                        summary: 'Student topic is not approved',
                        value: { errorCode: 'TOPIC_NOT_APPROVED', message: 'Đề tài của bạn chưa được duyệt', statusCode: 403 }
                    }
                }
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'Resource not found.',
        content: {
            'application/json': {
                examples: {
                    form_not_found: {
                        summary: 'Form not found',
                        value: { errorCode: 'FORM_NOT_FOUND', message: 'Form không tồn tại', statusCode: 404 }
                    },
                    submission_not_found: {
                        summary: 'Submission not found (for update)',
                        value: { errorCode: 'SUBMISSION_NOT_FOUND', message: 'Bản nộp không tồn tại hoặc không thuộc về bạn', statusCode: 404 }
                    },
                    field_not_found: {
                        summary: 'Field not found in form',
                        value: { errorCode: 'FIELD_NOT_FOUND', message: 'Trường dữ liệu không thuộc form này hoặc không tồn tại', statusCode: 404 }
                    },
                    choice_not_found: {
                        summary: 'Choice not found in field',
                        value: { errorCode: 'CHOICE_NOT_FOUND', message: 'Lựa chọn không thuộc trường trắc nghiệm này', statusCode: 404 }
                    },
                    answer_not_found: {
                        summary: 'Answer record not found (for update)',
                        value: { errorCode: 'ANSWER_NOT_FOUND', message: 'Câu trả lời không tồn tại', statusCode: 404 }
                    },
                    answer_checkbox_not_found: {
                        summary: 'Answer checkbox record not found (for update)',
                        value: { errorCode: 'ANSWER_CHECKBOX_NOT_FOUND', message: 'Câu trả lời trắc nghiệm không tồn tại', statusCode: 404 }
                    }
                }
            }
        }
    })
    @ApiConflictResponse({
        description: 'Conflict in submission state.',
        content: {
            'application/json': {
                example: { errorCode: 'SUBMISSION_EXISTED', message: 'Bạn đã nộp form này rồi', statusCode: 409 }
            }
        }
    })
    upsertSubmission(@Body() dto: UpdateSubmissionDTO, @Req() req: Request) {
        return this.submissionService.upsertSubmission(dto, req)
    }

    // Get one submission (detail)
    @Get()
    @ApiOperation({ summary: 'Get submission detail by ID' })
    @ApiOkResponse({
        description: 'Returns submission detail.',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                status: { type: 'string', example: 'pending' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                user: { type: 'object', properties: { id: { type: 'string' }, full_name: { type: 'string' }, email: { type: 'string' } } },
                form: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' } } },
                answers: {
                    type: 'array',
                    items: {
                        type: 'object', properties: {
                            id: { type: 'string' },
                            body: { type: 'string' },
                            file_name: { type: 'string', nullable: true },
                            input_type: { type: 'string' },
                            field: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } }
                        }
                    }
                },
                checkboxes: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            checkboxField: { type: 'object', properties: { id: { type: 'string' } } },
                            fieldChoices: { type: 'object', properties: { id: { type: 'string' }, body: { type: 'string' } } }
                        }
                    }
                }
            }
        }
    })
    @ApiForbiddenResponse({ description: 'Access denied.' })
    @ApiNotFoundResponse({ description: 'Submission not found.' })
    getSubmissionDetail(@Query() query: GetSubmissionDetailDto, @Req() req: Request) {
        return this.submissionService.getSubmissionDetail(query, req)
    }

    // Remove submission
    @Delete(':id')
    @ApiOperation({ summary: 'Hard delete a submission' })
    @ApiOkResponse({ description: 'Submission deleted successfully.', schema: { example: { message: 'Submission deleted successfully' } } })
    @ApiForbiddenResponse({ description: 'Access denied.' })
    @ApiNotFoundResponse({ description: 'Submission not found.' })
    @ApiBadRequestResponse({ description: 'Cannot delete submission while form is still open.' })
    deleteSubmission(@Param('id') id: string, @Req() req: Request) {
        return this.submissionService.deleteSubmission(id, req)
    }
}
