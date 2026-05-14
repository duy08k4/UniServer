import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "@app/decorators/roles.decorator";
import { MainRole } from "@app/enums/enums";
import { getUsersPaginationDTO, updateUserDTO } from "./admin.dto";

@ApiTags("Admin")
@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
@Roles(MainRole.UNIADMIN)
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }
    // Get users's info (pagination)
    @Get('users/pagination')
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '1ac24c89-bd53-49a8-af1e-d08dfa590914' },
                            supabase_id: { type: 'string' },
                            full_name: { type: 'string' },
                            email: { type: 'string' },
                            is_banned: { type: 'boolean' },
                            is_deleted: { type: 'boolean' },
                            role: { type: 'string' },
                            phone_number: { type: 'string', nullable: true },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'number', example: 1 },
                        size: { type: 'number', example: 10 },
                        total_users: { type: 'number', example: 1 },
                        totalPage: { type: 'number', example: 1 }
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Data is invalid',
        schema: {
            example: {
                statusCode: 400,
                message: 'Data is invalid',
                error: 'Bad Request'
            }
        }
    })
    @ApiForbiddenResponse({
        description: 'Access denied',
        schema: {
            example: {
                statusCode: 403,
                message: 'Access denied',
                error: 'Forbidden'
            }
        }
    })
    async getUsersPagination(@Query() query: getUsersPaginationDTO, @Req() req: Request) {
        return this.adminService.getUsersPagination(query, req);
    }

    // Get user's info (detail)
    @Get("user/:id")
    @ApiParam({ name: "id", required: true })
    async getOneUser(@Param('id') id: string, @Req() req: Request) {
        return this.adminService.getOneUser(id, req);
    }

    // Update user's info
    @Post("user/update/:id")
    @ApiParam({ name: "id", required: true })
    async updateUser(@Param('id') id: string, @Body() body: updateUserDTO, @Req() req: Request) {
        return this.adminService.updateUser(id, body, req);
    }
}