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

        const userRole = (await this.userRepository
        .createQueryBuilder('users')
        .select('users.role', 'role')
        .where('users.email = :email', { email: userEmail })
        .getRawOne()).role

        if (!roles.includes(userRole)) throw new ForbiddenException("Access denied")

        return true
    }
}