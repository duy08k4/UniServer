import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { AuthGuard } from "../auth/auth.guard";
import { SubmissionService } from "./submissions.service";
import { SubmissionPaginationDTO, UpdateSubmissionDTO } from "./submissions.dto";

@ApiTags("Submission")
@Controller('submission')
@UseGuards(AuthGuard, RoleGuard)
export class SubmissionController {
    constructor(private readonly submissionService: SubmissionService) { }

    @Post()
    @ApiOperation({ summary: 'Create or update a submission' })
    @ApiCreatedResponse({
        description: 'Submission created or updated successfully.',
        content: {
            'application/json': {
                example: {
                    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                    status: 'pending',
                    created_at: '2026-04-21T09:00:00.000Z',
                    updated_at: '2026-04-21T09:00:00.000Z',
                    answers: [
                        {
                            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
                            body: 'My answer',
                            input_type: 'string'
                        }
                    ],
                    checkboxes: [
                        {
                            id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
                            checkboxField: { id: 'd4e5f6a7-b8c9-0123-defa-234567890123' },
                            fieldChoices: { id: 'e5f6a7b8-c9d0-1234-efab-345678901234' }
                        }
                    ]
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Form is closed or answer/checkbox update failed.',
        content: {
            'application/json': {
                examples: {
                    form_stopped: {
                        summary: 'Form is closed',
                        value: { errorCode: 'FORM_STOPPED', message: 'Form is closed', statusCode: 400 }
                    },
                    answer_not_found: {
                        summary: 'Answer not found',
                        value: { errorCode: 'ANSWER_NOT_FOUND', message: 'Answer <id> not found', statusCode: 400 }
                    },
                    answer_checkbox_not_found: {
                        summary: 'Answer checkbox not found',
                        value: { errorCode: 'ANSWER_CHECKBOX_NOT_FOUND', message: 'Answer checkbox <id> not found', statusCode: 400 }
                    }
                }
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'Form, submission, field or choice not found.',
        content: {
            'application/json': {
                examples: {
                    form_not_found: {
                        summary: 'Form not found',
                        value: { errorCode: 'FORM_NOT_FOUND', message: 'Form not found', statusCode: 404 }
                    },
                    submission_not_found: {
                        summary: 'Submission not found',
                        value: { errorCode: 'SUBMISSION_NOT_FOUND', message: 'Submission not found', statusCode: 404 }
                    },
                    field_not_found: {
                        summary: 'Field not found',
                        value: { errorCode: 'FIELD_NOT_FOUND', message: 'Field <id> not found', statusCode: 404 }
                    },
                    choice_not_found: {
                        summary: 'Choice not found',
                        value: { errorCode: 'CHOICE_NOT_FOUND', message: 'Choice <id> not found', statusCode: 404 }
                    }
                }
            }
        }
    })
    @ApiConflictResponse({
        description: 'User has already submitted this form.',
        content: {
            'application/json': {
                example: { errorCode: 'SUBMISSION_EXISTED', message: 'You have already submitted this form', statusCode: 409 }
            }
        }
    })
    upsertSubmission(@Body() dto: UpdateSubmissionDTO, @Req() req: Request) {
        return this.submissionService.upsertSubmission(dto, req)
    }

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

    // Get one submission (detail)
    @Get(':id')
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
                    items: { type: 'object', properties: { id: { type: 'string' }, body: { type: 'string' }, input_type: { type: 'string' } } }
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
    getSubmissionDetail(@Param('id') id: string, @Req() req: Request) {
        return this.submissionService.getSubmissionDetail(id, req)
    }

    // Update submission

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
