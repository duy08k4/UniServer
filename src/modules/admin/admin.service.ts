import { Users } from "@app/entities/user.en";
import { MainRole, Role } from "@app/enums/enums";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Raw, Repository } from "typeorm";
import { getUsersPaginationDTO, updateUserDTO } from "./admin.dto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import { GlobalGateway } from "../socket/socketGlobal.gateway";

@Injectable()
export class AdminService {
    private readonly supabase: SupabaseClient

    constructor(
        private readonly configService: ConfigService,
        private readonly globalGateway: GlobalGateway,
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
    ) {
        const supabaseURL = this.configService.get('SUPABASE_URL')
        const supabaseKEY = this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
        this.supabase = createClient(supabaseURL, supabaseKEY)
    }
    // Get users's info (pagination)
    async getUsersPagination(query: getUsersPaginationDTO, req: Request | any) {
        const client = req.userData

        if (client.role !== Role.UNIADMIN) throw new ForbiddenException('Access denied')

        const { page, size, search, is_banned, is_deleted } = query

        if (!page || !size) throw new BadRequestException('Data is invalid')

        const [users, total] = await this.userRepo.findAndCount({
            where: search ?
                {
                    role: MainRole.USER,
                    email: Raw((alias) => `
                        unaccent(${alias}) ILIKE unaccent('%${search}%') OR
                        unaccent(full_name) ILIKE unaccent('%${search}%')
                    `, { search: `%${search}%` }),
                    is_banned: is_banned,
                    is_deleted: is_deleted
                }
                : {
                    role: MainRole.USER
                },
            skip: (Number.parseInt(page) - 1) * Number.parseInt(size),
            take: Number.parseInt(size)
        })

        return {
            data: users,
            pagination: {
                page: Number.parseInt(page),
                size: Number.parseInt(size),
                total_users: total,
                totalPage: Math.ceil(total / Number.parseInt(size))
            }
        }
    }

    // Get user's info (detail)
    async getOneUser(userId: string, req: Request | any) {
        const client = req.userData

        if (client.role !== Role.UNIADMIN) throw new ForbiddenException('Access denied')
            console.log(userId)

        if (!userId) throw new BadRequestException('User ID is required')

        const user = await this.userRepo.findOne({
            select: {
                id: true,
                supabase_id: true,
                email: true,
                full_name: true,
                role: true,
                is_banned: true,
                is_deleted: true,
                created_at: true,
                updated_at: true
            },
            where: { id: userId }
        })

        if (!user) throw new NotFoundException('User not found')

        const { data, error } = await this.supabase.auth.admin.getUserById(user.supabase_id)

        if (!data.user) throw new NotFoundException('User not found')

        return {
            ...user, email_confirm: data.user.email_confirmed_at
        }
    }

    // Update user's info
    async updateUser(userId: string, body: updateUserDTO, req: Request | any) {
        const client = req.userData

        if (client.role !== Role.UNIADMIN) throw new ForbiddenException('Access denied')

        if (!userId) throw new BadRequestException('User ID is required')

        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundException('User not found')

        const { is_banned, is_deleted } = body

        if (typeof is_banned !== 'boolean' && typeof is_deleted !== 'boolean')
            throw new BadRequestException('No data to update')

        if (typeof is_banned === 'boolean') user.is_banned = is_banned
        if (typeof is_deleted === 'boolean') user.is_deleted = is_deleted

        const updated = await this.userRepo.save(user)

        // Emit force-logout if banned or deleted
        if (is_banned === true || is_deleted === true) {
            this.globalGateway.forceLogout({
                userId,
                reason: is_deleted ? 'deleted' : 'banned'
            })
        }

        return updated
    }
}