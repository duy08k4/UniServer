import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { NotificationsPaginationDTO, UpdateNotificationDTO } from "./notifications.dto";
import { NotificationsService } from "./notifications.service";
import { RoleGuard } from "../auth/role.guard";
import { AuthGuard } from "../auth/auth.guard";
import { MainRole } from "@app/enums/enums";
import { Roles } from "@app/decorators/roles.decorator";

@ApiTags("Notification")
@Controller('notivications')
@UseGuards(AuthGuard, RoleGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService
    ) { }

    // Get all notifications (pagination)
    @Get()
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Returns paginated notifications',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            body: { type: 'string' },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' },
                            createdBy: { type: 'object', properties: { id: { type: 'string' }, full_name: { type: 'string' }, email: { type: 'string' } } },
                            class: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, join_code: { type: 'string' }, subject: { type: 'string' } } },
                            milestone: { nullable: true, type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, description: { type: 'string', nullable: true } } },
                        }
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        page: { type: 'number' },
                        size: { type: 'number' },
                        totalPages: { type: 'number' },
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Invalid data / Class ID is required' })
    async notificationsPagination(@Query() query: NotificationsPaginationDTO, @Req() req: Request) {
        return this.notificationsService.notificationsPagination(query, req)
    }

    // Get one notification (get detail)
    @Get(":id")
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({
        description: 'Returns notification detail',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                body: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                createdBy: { type: 'object', properties: { id: { type: 'string' }, full_name: { type: 'string' }, email: { type: 'string' } } },
                class: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, join_code: { type: 'string' }, subject: { type: 'string' } } },
                milestone: { nullable: true, type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, description: { type: 'string', nullable: true } } },
            }
        }
    })
    @ApiNotFoundResponse({ description: 'Notification not found' })
    async getNotification(@Param('id') id: string) {
        return this.notificationsService.getNotification(id)
    }

    // Update notification
    @Post("update")
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiCreatedResponse({
        description: 'Created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'uuid' },
                title: { type: 'string', example: 'Notification title' },
                body: { type: 'string', example: 'Notification body' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                createdBy: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        full_name: { type: 'string' },
                        email: { type: 'string' },
                    }
                },
                class: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        join_code: { type: 'string' },
                        subject: { type: 'string' },
                    }
                },
                milestone: {
                    nullable: true,
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        description: { type: 'string', nullable: true },
                    }
                },
            }
        }
    })
    @ApiNotFoundResponse({ description: 'Notification not found' })
    @ApiBadRequestResponse({ description: 'Invalid data' })
    @ApiForbiddenResponse({ description: 'Access denied' })
    async updateNotification(@Body() body: UpdateNotificationDTO, @Req() req: Request) {
        return this.notificationsService.updateNotification(body, req)
    }

    // Remove notification
    @Delete(":id")
    @Roles(MainRole.UNIADMIN, MainRole.USER)
    @ApiOkResponse({ description: 'Deleted successfully', schema: { type: 'object', properties: { message: { type: 'string', example: 'Deleted successfully' } } } })
    @ApiNotFoundResponse({ description: 'Notification not found' })
    @ApiForbiddenResponse({ description: 'Access denied' })
    async removeNotification(@Param('id') id: string, @Req() req: Request) {
        return this.notificationsService.removeNotification(id, req)
    }
}