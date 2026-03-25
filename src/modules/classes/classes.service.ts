import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { CreateClassDTO, GetClassDTO, JoinClassDTO, RemoveClassDTO, RemoveMemberDTO, UpdateClassDTO, UpdateCommitteeDTO } from "./classes.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/user.en";
import { Brackets, DataSource, Repository } from "typeorm";
import { Classes } from "src/entities/classes.en";
import { nanoid } from "nanoid";
import { ClassGateway } from "../websocket/class.gateway";
import { ClassMembers } from "src/entities/class_members.en";
import { Role, RoomRole } from "src/enums/enums";

@Injectable()
export class ClassesService {
    constructor(
        private dataSource: DataSource,
        private readonly classGateway: ClassGateway,
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
        @InjectRepository(Classes)
        private readonly classRepo: Repository<Classes>,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
    ) { }

    // Approve class creation
    async approveNewClass(classId: string) {
        try {
            const { affected, } = await this.classRepo.createQueryBuilder()
                .update(Classes)
                .set({ created_approval: true })
                .where("id = :id", { id: classId })
                .execute()


            if (affected) {
                return {
                    message: 'Approval successful!',
                    data: {}
                }
            } else throw new NotFoundException("Class not found")

        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Get class
    async getClass(query: GetClassDTO, req: Request | any) {
        const { userId, page, size, search } = query

        if (!page) throw new BadRequestException("Bad request")

        const pageSize = size ? Number.parseInt(size) : 20
        const userRole = req.role
        let allClass
        let totalClasses

        if (userRole === Role.UNIADMIN) {
            totalClasses = await this.classRepo.count()

            allClass = await this.classRepo.createQueryBuilder("c")
                .leftJoin('c.members', 'm')
                .leftJoin('c.members', 'owner', 'owner.role = :roomAdminRole')
                .leftJoin('owner.user', 'ownerUser')
                .where(new Brackets(qb => {
                    if (search) {
                        qb.where('unaccent(c.label) ILIKE unaccent(:searchTerm)')
                            .orWhere('unaccent(c.subject) ILIKE unaccent(:searchTerm)')
                            .orWhere('unaccent("ownerUser"."full_name") ILIKE unaccent(:searchTerm)')
                            .orWhere('unaccent("ownerUser"."email") ILIKE unaccent(:searchTerm)');
                    }
                }))
                .select([
                    'c.id AS id',
                    'c.join_code AS join_code',
                    'c.label AS label',
                    'c.description AS description',
                    'c.subject AS subject',
                    'c.created_approval AS created_approval',
                    'c.required_join_form AS required_join_form',
                    'c.required_approval AS required_approval',
                    'c.is_banned AS is_banned',
                    'c.is_deleted AS is_deleted',
                    'c.created_at AS created_at',
                    'c.createdBy AS createdBy'
                ])
                .addSelect(`
                    json_build_object(
                        'student', COUNT(CASE WHEN m.role = :studentRole THEN 1 END),
                        'lecturer', COUNT(CASE WHEN m.role = :lecturerRole THEN 1 END),
                        'committee', COUNT(CASE WHEN m.is_committee_member = :committee THEN 1 END)
                    )`,
                    'counts'
                )
                .addSelect(`
                    json_build_object(
                        'full_name', "ownerUser"."full_name",
                        'email', "ownerUser"."email"
                    )`,
                    'owner',
                )
                .setParameters({
                    studentRole: RoomRole.STUDENT,
                    lecturerRole: RoomRole.LECTURER,
                    committee: 'true',
                    roomAdminRole: RoomRole.ROOMADMIN,
                    searchTerm: `%${search}%`
                })
                .groupBy('c.id, ownerUser.full_name, ownerUser.email')
                .skip((Number.parseInt(page) - 1) & pageSize)
                .take(pageSize)
                .getRawMany()

        } else {
            if (!userId) throw new BadRequestException("Bad request")

            const userExistance = await this.userRepo.findOne({ where: { id: userId } })

            if (!userExistance) throw new NotFoundException("User not found")

            totalClasses = await this.classRepo.count({ where: { members: { user: { id: userId } } } })

            allClass = await this.classRepo.createQueryBuilder("c")
                .leftJoin('c.members', 'm')
                .leftJoin('m.user', 'u')
                .leftJoin('c.members', 'owner', 'owner.role = :roomAdminRole')
                .leftJoin('owner.user', 'ownerUser')
                .where(new Brackets(qb => {
                    if (search) {
                        qb.where('unaccent(c.label) ILIKE unaccent(:searchTerm)')
                            .orWhere('unaccent(c.subject) ILIKE unaccent(:searchTerm)')
                            .orWhere('unaccent("ownerUser"."full_name") ILIKE unaccent(:searchTerm)')
                            .orWhere('unaccent("ownerUser"."email") ILIKE unaccent(:searchTerm)');
                    }
                }))
                .select([
                    'c.id AS id',
                    'c.join_code AS join_code',
                    'c.label AS label',
                    'c.description AS description',
                    'c.subject AS subject',
                    'c.created_approval AS created_approval',
                    'c.required_join_form AS required_join_form',
                    'c.required_approval AS required_approval',
                    'c.is_banned AS is_banned',
                    'c.is_deleted AS is_deleted',
                    'c.created_at AS created_at',
                    'c.createdBy AS createdBy',
                ])
                .addSelect(` 
                    json_build_object(
                        'student', COUNT(CASE WHEN m.role = :studentRole THEN 1 END),
                        'lecturer', COUNT(CASE WHEN m.role = :lecturerRole THEN 1 END),
                        'committee', COUNT(CASE WHEN m.is_committee_member = :committee THEN 1 END)
                    )`,
                    'counts'
                )
                .addSelect(`
                    json_build_object(
                        'full_name', "ownerUser"."full_name",
                        'email', "ownerUser"."email"
                    )`,
                    'owner',
                )
                .setParameters({
                    studentRole: RoomRole.STUDENT,
                    lecturerRole: RoomRole.LECTURER,
                    committee: 'true',
                    roomAdminRole: RoomRole.ROOMADMIN,
                    searchTerm: `%${search}%`
                })
                .where('u.id = :id', { id: userId })
                .groupBy(`c.id, ownerUser.full_name, ownerUser.email`)
                .skip((Number.parseInt(page) - 1) * pageSize)
                .take(pageSize)
                .getRawMany()
        }

        return {
            data: allClass,
            pagination: {
                page: Number.parseInt(page),
                size: pageSize,
                total_classes: totalClasses,
                totalPage: Math.round(totalClasses / pageSize)
            }
        }
    }

    // Create a new class
    async createNewClass(dto: CreateClassDTO) {
        try {
            const { userId, label, subject, description } = dto

            if (!userId || !label || !subject) throw new BadRequestException("Bad request")

            // Check user existance 
            const user = await this.userRepo.findOne({ where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            // Generate join code
            let joinCode: string

            do {
                joinCode = nanoid(6)
            } while (await this.classRepo.findOne({ where: { join_code: joinCode } }))

            // Create class
            const newClass = await this.classRepo.create({
                join_code: joinCode,
                label, subject, description,
                createdBy: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
            })

            await this.classRepo.save(newClass)

            const newMember = await this.classMemberRepo.create({
                role: RoomRole.ROOMADMIN,
                class: newClass,
                user: user
            })

            await this.classMemberRepo.save(newMember)

            return newClass

        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Remove a class
    async removeClass(query: RemoveClassDTO) {
        try {
            const { classId, userId } = query

            if (!classId || !userId) throw new BadRequestException("Bad request")

            const userExistance = await this.classMemberRepo.findOne({ where: { user: { id: userId } } })

            if (!userExistance) throw new NotFoundException("User not found")
            const memberRole = userExistance.role

            if (memberRole !== RoomRole.ROOMADMIN) throw new ForbiddenException("Forbidden - Access denied")

            const countMember = await this.classMemberRepo.count({
                where: { class: { id: classId } }
            })

            if (countMember <= 1) { // Only host
                await this.classRepo.delete({ id: classId })

            } else {
                await this.classRepo.createQueryBuilder()
                    .update(Classes)
                    .set({ is_deleted: true })
                    .where("id = :id", { id: classId })
                    .execute()
            }

            return {
                message: 'Remove successful!',
                data: {}
            }

        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Join to a class
    async joinClass(joinClassDto: JoinClassDTO) {
        const { userId, joinCode, joinRole } = joinClassDto

        const userExistance = await this.userRepo.findOne({ where: { id: userId } })
        if (!userExistance) throw new NotFoundException("User not found")

        const classExistance = await this.classRepo.findOne({ where: { join_code: joinCode } })
        if (!classExistance) throw new NotFoundException("Class not found")

        const isMember = await this.classMemberRepo.findOne({ where: { user: { id: userId }, class: { join_code: joinCode } } })
        if (isMember) throw new ConflictException("User already in class")

        const newMember = await this.classMemberRepo.create({
            role: joinRole,
            class: classExistance,
            roomadmin_approved: !classExistance.required_approval,
            user: userExistance
        })

        await this.classMemberRepo.save(newMember)

        return {
            message: 'Joined',
            data: {}
        }
    }

    async updateCommittee(updateCommitteeDto: UpdateCommitteeDTO) {
        const { userId, isCommittee } = updateCommitteeDto

        if (!userId) throw new BadRequestException("Bad request")

        await this.dataSource.transaction(async (manager) => {
            const classMember = await manager.findOne(ClassMembers, { where: { role: RoomRole.LECTURER, user: { id: userId } } })

            if (!classMember) throw new UnprocessableEntityException("Role must be LECTURER")
            if (classMember.is_committee_member === isCommittee) throw new ConflictException(`User is ${!classMember.is_committee_member ? "not " : ""}a committee`)

            await manager.update(ClassMembers, {
                user: { id: userId },
                role: RoomRole.LECTURER
            }, {
                is_committee_member: isCommittee
            })
        })

        return {
            message: 'Added new committee',
            data: {}
        }
    }

    // Update some information in class
    async updateClass(query: UpdateClassDTO) {
        try {
            const { classId, userId, label, description, subject, required_approval, required_join_form } = query

            if (!classId || !userId) throw new BadRequestException("Bad request")
            if (!label && !description && !subject && !required_approval && !required_join_form) throw new BadRequestException("Bad request")

            const classExistance = await this.classRepo.findOne({ where: { id: classId } })

            if (!classExistance) throw new NotFoundException("Class not found")

            const member = await this.classMemberRepo.findOne({ where: { user: { id: userId } } })

            if (!member) throw new NotFoundException("User not found")
            if (member.role !== RoomRole.ROOMADMIN) throw new ForbiddenException("Forbidden - Access denied")

            const updateData: Record<string, any> = {}

            if (label) updateData.label = label
            if (description) updateData.description = description
            if (subject) updateData.subject = subject
            if (required_approval) updateData.required_approval = required_approval
            if (required_join_form) updateData.required_join_form = required_join_form

            await this.classRepo.createQueryBuilder()
                .update(Classes)
                .set({ ...updateData })
                .where("id = :id", { id: classId })
                .execute()

            return {
                message: 'Update successful!',
                data: {}
            }
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Remove member
    async removeMember(query: RemoveMemberDTO, req: Request | any) {
        const { userId, classId, newOwnerId } = query

        if (!userId || !classId) throw new BadRequestException("Bad request")

        const classExistance = await this.classRepo.findOne({ where: { id: classId } })
        if (!classExistance) throw new NotFoundException("Class not found")

        const memberExistance = await this.classMemberRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user']
        })
        if (!memberExistance) throw new NotFoundException("User not found")

        const userRole = req.role

        if (userRole === Role.UNIADMIN) { // Hard delete member
            await this.classMemberRepo.delete({ user: { id: userId } })

            return {
                message: 'Update successful!',
                data: {}
            }
        } else {
            if (memberExistance.role === RoomRole.ROOMADMIN) {
                const ownerRequest: Users = req.userData
                if (ownerRequest.id === memberExistance.user.id) { // If the owner removes themselves, reassign the admin role to another member
                    if (!newOwnerId) throw new BadRequestException("New owner id is invalid")
                    const newOwner = await this.classMemberRepo.findOne({ where: { user: { id: newOwnerId } } })
                    if (!newOwner) throw new NotFoundException("New owner not found")

                    await this.dataSource.transaction(async (manager) => {
                        await manager.update(ClassMembers, {
                            class: { id: classId },
                            user: { id: newOwnerId }
                        }, {
                            role: RoomRole.ROOMADMIN
                        })

                        await manager.delete(ClassMembers, {
                            user: { id: userId },
                            class: { id: classId }
                        })
                    })

                    return true
                } else { // Hard delete member
                    return false
                }

            } else throw new ForbiddenException("Access denied")

        }
    }

    // Update role in class
    async updateRoleInClass(classId: string, memberId: string, roleUpdate: RoomRole) {
        if (!classId || !memberId || !roleUpdate) throw new BadRequestException("Bad request")

        const classExistance = await this.classRepo.findOne({ where: { id: classId } })
        if (!classExistance) throw new NotFoundException("Class not found")

        const memberExistance = await this.classMemberRepo.findOne({ where: { user: { id: memberId } } })
        if (!memberExistance) throw new NotFoundException("User not found in class")
        if (memberExistance.role === roleUpdate) throw new ConflictException(`User's role is ${roleUpdate} (recent)`)

        await this.classMemberRepo.createQueryBuilder()
            .update(ClassMembers)
            .set({ role: roleUpdate })
            .where('user.id = :id', { id: memberId })
            .execute()

        return true
    }
}
