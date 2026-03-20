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
            const { usecaseID } = query

            if (usecaseID) {
                const useCase = await this.usecaseRepository.findOne({ where: { id: usecaseID } })

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
            const { module, uc_name, description, priority } = usecaseData
            const useCaseExistance = await this.usecaseRepository.findOne({ where: { module, uc_name, description, priority } })

            if (useCaseExistance) throw new ConflictException("Usecase already exists!")

            const newUsecase = this.usecaseRepository.create({ module, description, uc_name, priority })
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
            const whereClause: any = {}

            if (usecaseID) whereClause.usecase_id = { id: usecaseID }
            if (role) whereClause.role = role

            const permissions = await this.permissionRepository.find({
                where: whereClause,
                relations: ['usecase_id']
            })

            if (permissions.length === 0) throw new NotFoundException('Permissions do not exist!')
            return permissions
        } catch (error) {
            throw new NotFoundException(`Permissions do not exist! ${error.message}`)
        }
    }

    // Add permission
    async addPermission(permissionData: AddPermissionDTO) {
        try {
            const { usecase_id, role, ...rest } = permissionData
            const usecase = await this.usecaseRepository.findOne({ where: { id: usecase_id } })
            if (!usecase) throw new NotFoundException('Usecase does not exist!')

            const permissionExistance = await this.permissionRepository.findOne({
                where: { usecase_id: { id: usecase_id }, role }
            })

            if (permissionExistance) throw new ConflictException("Permission already exists for this role and usecase!")

            const newPermission = this.permissionRepository.create({
                usecase_id: usecase,
                role,
                ...rest
            })
            return await this.permissionRepository.save(newPermission)
        } catch (error) {
            throw new BadGatewayException(error.message)
        }
    }

    // Update permission
    async updatePermission(permissionData: UpdatePermissionDTO) {
        try {
            const { id, ...updateData } = permissionData
            const permission = await this.permissionRepository.findOne({ where: { id } })

            if (!permission) throw new NotFoundException('Permission does not exist!')

            await this.permissionRepository.update(id, updateData)
            return await this.permissionRepository.findOne({ where: { id }, relations: ['usecase_id'] })
        } catch (error) {
            throw new BadGatewayException(error.message)
        }
    }
}