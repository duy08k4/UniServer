import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

// Service
import { AdminService } from "./admin.service";

// Guard
import { AuthGuard } from "../auth/auth.guard";
import { RoleGuard } from "../auth/role.guard";

// Decorator
import { Roles } from "src/decorators/roles.decorator";

// Enum
import { Role } from "src/enums/enums";
import { AddPermissionDTO, AddUseCaseDTO, GetPermissionQueryDTO, GetUseCaseQueryDTO, RemoveUseCaseDTO, UpdatePermissionDTO, UpdateUseCaseDTO } from "./admin.dto";

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private adminService: AdminService
    ) { }
    // Get usecase
    @ApiOperation({ summary: '(Signed) (Role: Public)' })
    @Get('usecase')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        schema: {
            oneOf: [
                {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6' },
                        module: { type: 'string', example: 'Class' },
                        uc_name: { type: 'string', example: 'CLS_DLT' },
                        description: { type: 'string', example: 'Xóa lớp học' },
                        priority: { type: 'string', example: 'must_have' },
                    },
                },
                {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6' },
                            module: { type: 'string', example: 'Class' },
                            uc_name: { type: 'string', example: 'CLS_DLT' },
                            description: { type: 'string', example: 'Xóa lớp học' },
                            priority: { type: 'string', example: 'must_have' },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: {
            example: {
                statusCode: 401,
                message: "Unauthorized"
            }
        }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: {
            example: {
                statusCode: 403,
                message: "Access denied"
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Usecase does not exist!',
    })
    async getUseCase(@Query() query: GetUseCaseQueryDTO) {
        return this.adminService.getUseCase(query)
    }

    // Add usecase
    @Post('usecase/add')
    @ApiOperation({ summary: '(Signed) (Only Uniadmin)' })
    @Roles(Role.UNIADMIN)
    @UseGuards(AuthGuard, RoleGuard)
    @ApiResponse({
        status: 201,
        description: 'Usecase created successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6' },
                module: { type: 'string', example: 'Action' },
                uc_name: { type: 'string', example: 'ACT_CN' },
                description: { type: 'string', example: 'Hành động mới' },
                priority: { type: 'string', example: 'must_have' },
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { example: { statusCode: 401, message: "Unauthorized" } }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: { example: { statusCode: 403, message: "Access denied" } }
    })
    @ApiResponse({ status: 409, description: 'Usecase already exists!' })
    @ApiResponse({ status: 502, description: 'Bad Gateway' })
    async addUseCase(@Body() usecaseData: AddUseCaseDTO) {
        return this.adminService.addUseCase(usecaseData)
    }

    // Update usecase
    @Put('usecase/update')
    @ApiOperation({ summary: '(Signed) (Only Uniadmin)' })
    @Roles(Role.UNIADMIN)
    @UseGuards(AuthGuard, RoleGuard)
    @ApiResponse({
        status: 200,
        description: 'Usecase updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6' },
                module: { type: 'string', example: 'Action' },
                uc_name: { type: 'string', example: 'ACT_CN_UPDATED' },
                description: { type: 'string', example: 'Hành động đã cập nhật' },
                priority: { type: 'string', example: 'should_have' },
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { example: { statusCode: 401, message: "Unauthorized" } }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: { example: { statusCode: 403, message: "Access denied" } }
    })
    @ApiResponse({ status: 404, description: 'Usecase does not exist!' })
    @ApiResponse({ status: 502, description: 'Bad Gateway' })
    async updateUseCase(@Body() usecaseData: UpdateUseCaseDTO) {
        return this.adminService.updateUseCase(usecaseData)
    }

    // Remove usecase
    @Delete('usecase/remove')
    @ApiOperation({ summary: '(Signed) (Only Uniadmin)' })
    @Roles(Role.UNIADMIN)
    @UseGuards(AuthGuard, RoleGuard)
    @ApiResponse({
        status: 200,
        description: 'Remove usecase successfully',
        schema: { example: { message: 'Remove usecase successfully' } }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { example: { statusCode: 401, message: "Unauthorized" } }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: { example: { statusCode: 403, message: "Access denied" } }
    })
    @ApiResponse({ status: 404, description: 'Usecase does not exist!' })
    async removeUseCase(@Query() query: RemoveUseCaseDTO) {
        return this.adminService.removeUseCase(query)
    }

    // Get permission
    @Get('permission')
    @ApiOperation({ summary: '(Signed) (Role: Public)' })
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
                    role: { type: 'string', example: 'user' },
                    can_view: { type: 'boolean', example: true },
                    can_create: { type: 'boolean', example: false },
                    can_edit: { type: 'boolean', example: false },
                    can_delete: { type: 'boolean', example: false },
                    can_approve: { type: 'boolean', example: false },
                    usecase_id: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: '84b5ae6a-837b-4cc0-a158-9dbf2b86e8e6' },
                            uc_name: { type: 'string', example: 'CLS_DLT' }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { example: { statusCode: 401, message: "Unauthorized" } }
    })
    @ApiResponse({ status: 404, description: 'Permissions do not exist!' })
    async getPermission(@Query() query: GetPermissionQueryDTO) {
        return this.adminService.getPermission(query)
    }

    // Add permission
    @Post('permission/add')
    @ApiOperation({ summary: '(Signed) (Only Uniadmin)' })
    @Roles(Role.UNIADMIN)
    @UseGuards(AuthGuard, RoleGuard)
    @ApiResponse({
        status: 201,
        description: 'Permission added successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
                role: { type: 'string', example: 'user' },
                can_view: { type: 'boolean', example: true }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { example: { statusCode: 401, message: "Unauthorized" } }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: { example: { statusCode: 403, message: "Access denied" } }
    })
    @ApiResponse({ status: 409, description: 'Permission already exists!' })
    async addPermission(@Body() permissionData: AddPermissionDTO) {
        return this.adminService.addPermission(permissionData)
    }

    // Update permission
    @Put('permission/update')
    @ApiOperation({ summary: '(Signed) (Only Uniadmin)' })
    @Roles(Role.UNIADMIN)
    @UseGuards(AuthGuard, RoleGuard)
    @ApiResponse({
        status: 200,
        description: 'Permission updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
                can_view: { type: 'boolean', example: true },
                can_edit: { type: 'boolean', example: true }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
        schema: { example: { statusCode: 401, message: "Unauthorized" } }
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
        schema: { example: { statusCode: 403, message: "Access denied" } }
    })
    @ApiResponse({ status: 404, description: 'Permission does not exist!' })
    async updatePermission(@Body() permissionData: UpdatePermissionDTO) {
        return this.adminService.updatePermission(permissionData)
    }
}
