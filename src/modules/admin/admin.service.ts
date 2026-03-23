import { BadGatewayException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

// Entities
import { UseCases } from "src/entities/use_cases.en";
import { UseCasePermission } from "src/entities/use_case_permissions.en";

// DTO
import { AddPermissionDTO, AddUseCaseDTO, GetPermissionQueryDTO, GetUseCaseQueryDTO, RemoveUseCaseDTO, UpdatePermissionDTO, UpdateUseCaseDTO } from "./admin.dto";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(UseCases)
        private usecaseRepository: Repository<UseCases>,
        @InjectRepository(UseCasePermission)
        private permissionRepository: Repository<UseCasePermission>
    ) { }

    // Get usecase
    async getUseCase(query: GetUseCaseQueryDTO) {
        try {
            const { usecaseID, search, sort_order, sort_by, } = query
            
            if (usecaseID || search || sort_order || sort_by) {

                const query = this.usecaseRepository
                    .createQueryBuilder("u")

                if (search) {
                    query.where("u.module ILIKE :search", { search: `%${search}%` })
                        .orWhere("u.uc_name ILIKE :search", { search: `%${search}%` })
                        .orWhere("u.uc_key ILIKE :search", { search: `%${search}%` })
                }

                if (sort_by && sort_order) {
                    query.orderBy(`u.${sort_by}`, sort_order === 'DESC' ? 'DESC' : 'ASC')
                }

                const useCase = await query.getMany()
                if (!useCase) throw new NotFoundException('Usecase does not exist!')
                return useCase
            } else {
                const allUseCase = await this.usecaseRepository.find()

                if (allUseCase.length === 0) throw new NotFoundException('Usecases do not exist!')
                return allUseCase
            }
        } catch (error) {
            throw new NotFoundException(`Usecase does not exist! ${error.message}`)
        }
    }

    // Add usecase
    async addUseCase(usecaseData: AddUseCaseDTO) {
        try {
            const { module, uc_name, uc_key, priority } = usecaseData
            const useCaseExistance = await this.usecaseRepository.findOne({ where: { module, uc_name, uc_key, priority } })

            if (useCaseExistance) throw new ConflictException("Usecase already exists!")

            const newUsecase = this.usecaseRepository.create({ module, uc_key, uc_name, priority })
            return await this.usecaseRepository.save(newUsecase)

        } catch (error) {
            throw new BadGatewayException(error.message)
        }
    }

    // Update usecase
    async updateUseCase(usecaseData: UpdateUseCaseDTO) {
        try {
            const { id, ...updateData } = usecaseData
            const useCase = await this.usecaseRepository.findOne({ where: { id } })

            if (!useCase) throw new NotFoundException('Usecase does not exist!')

            await this.usecaseRepository.update(id, updateData)
            return await this.usecaseRepository.findOne({ where: { id } })
        } catch (error) {
            throw new BadGatewayException(error.message)
        }
    }

    // Remove usecase
    async removeUseCase(query: RemoveUseCaseDTO) {
        try {
            const { id } = query
            const useCase = await this.usecaseRepository.findOne({ where: { id } })

            if (!useCase) throw new NotFoundException('Usecase does not exist!')

            await this.usecaseRepository.delete(id)
            return { message: 'Remove usecase successfully' }
        } catch (error) {
            throw new BadGatewayException(error.message)
        }
    }

    // Get permission
    async getPermission(query: GetPermissionQueryDTO) {
        try {
            const { usecaseID, role } = query

            if (usecaseID || role) {
                const queryDB = this.permissionRepository.createQueryBuilder('p').leftJoinAndSelect("p.usecase", "u")
                if (usecaseID) queryDB.andWhere("u.id = :usecaseID", { usecaseID })
                if (role) queryDB.andWhere("p.role = :role", { role: role })

                const permission = await queryDB.getMany()
                if (!permission) throw new NotFoundException('Usecase does not exist!')
                return permission
            } else {
                const queryDB = this.permissionRepository.createQueryBuilder('p').leftJoinAndSelect("p.usecase", "u")
                const permission = await queryDB.getMany()
                if (!permission) throw new NotFoundException('Usecase does not exist!')
                return permission
            }
        } catch (error) {
            throw new NotFoundException(`Permissions do not exist! ${error.message}`)
        }
    }

    // Update permission (Upsert)
    async updatePermission(permissionData: { usecaseId: string, permissions: UpdatePermissionDTO[] }) {
        try {
            const { usecaseId, permissions } = permissionData

            const usecase = await this.usecaseRepository.findOne({ where: { id: usecaseId } })
            if (!usecase) throw new NotFoundException('Usecase does not exist!')

            // Filter new permission
            const newPermission = permissions.filter(permission => !permission.id).map(({ id, ...p }) => ({
                ...p, usecase
            }))

            const { } = await this.permissionRepository.createQueryBuilder()
                .insert()
                .into(UseCasePermission)
                .values(newPermission)
                .execute()

            // Permission case
            const permissionUpdate = permissions.filter(p => p.id)

            const permissionIds = permissionUpdate.map(p => `'${p.id}'`).join(",")

            const canViewCase = `CASE id
                    ${permissionUpdate.map(p => `WHEN '${p.id}' THEN ${p.can_view ? true : false}`).join("\n")}
                END`

            const canCreateCase = `CASE id
                    ${permissionUpdate.map(p => `WHEN '${p.id}' THEN ${p.can_create ? true : false}`).join("\n")}
                END`

            const canEditCase = `CASE id
                    ${permissionUpdate.map(p => `WHEN '${p.id}' THEN ${p.can_edit ? true : false}`).join("\n")}
                END`

            const canDeleteCase = `CASE id
                    ${permissionUpdate.map(p => `WHEN '${p.id}' THEN ${p.can_delete ? true : false}`).join("\n")}
                END`

            const canApproveCase = `CASE id
                    ${permissionUpdate.map(p => `WHEN '${p.id}' THEN ${p.can_approve ? true : false}`).join("\n")}
                END`

            const { } = await this.permissionRepository
                .createQueryBuilder()
                .update()
                .set({
                    can_view: () => canViewCase,
                    can_create: () => canCreateCase,
                    can_edit: () => canEditCase,
                    can_delete: () => canDeleteCase,
                    can_approve: () => canApproveCase
                })
                .where(`id IN (${permissionIds})`)
                .execute()

            return {
                message: 'Update successful!',
                data: {}
            }

        } catch (error) {
            throw new BadGatewayException(error.message)
        }
    }
}
