import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { ROLES_KEY } from "src/decorators/roles.decorator";
import { Users } from "src/entities/user.en";
import { Repository } from "typeorm";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectRepository(Users)
        private userRepository: Repository<Users>
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()])

        if (!roles) return true

        const request = context.switchToHttp().getRequest()
        const userEmail = request.user.data.user.email

        const user = (await this.userRepository
            .createQueryBuilder('u')
            .select([
                'u.id AS id',
                'u.supabase_id AS supabase_id',
                'u.full_name AS full_name',
                'u.email AS email',
                'u.is_banned AS is_banned',
                'u.is_deleted AS is_deleted',
                'u.role AS role',
                'u.phone_number AS phone_number',
                'u.created_at AS created_at',
                'u.updated_at AS updated_at'
            ])
            .where('u.email = :email', { email: userEmail })
            .getRawOne())

        if (!roles.includes(user.role)) throw new ForbiddenException("Access denied")

        request.role = user.role
        request.userData = user
        return true
    }
}