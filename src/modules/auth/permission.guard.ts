import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable } from "rxjs";
import { PERMISSION_KEY } from "src/decorators/permission.decorator";
import { UseCasePermission } from "src/entities/use_case_permissions.en";
import { Users } from "src/entities/user.en";
import { Repository } from "typeorm";

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectRepository(UseCasePermission)
        private readonly permission: Repository<UseCasePermission>,
        @InjectRepository(Users)
        private readonly users: Repository<Users>
    ) {

    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const required = this.reflector.getAllAndOverride(PERMISSION_KEY, [context.getHandler(), context.getClass()])

        if (!required) return true

        const request = context.switchToHttp().getRequest()
        const userRole = request.role

        const permission = await this.permission.findOne({
            where: {
                role: userRole,
                usecase: { uc_key: required.ucKey }
            }
        })

        return permission ? !!permission[required.action] : false
    }
}