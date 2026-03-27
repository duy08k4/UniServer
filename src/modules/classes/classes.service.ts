import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { CreateClassDTO, GetClassDTO, JoinClassDTO, RemoveClassDTO, RemoveMemberDTO, UpdateClassDTO, UpdateCommitteeDTO } from "./classes.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/user.en";
import { Brackets, DataSource, ILike, In, Or, Raw, Repository } from "typeorm";
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
        let handledClasses

        if (userRole === Role.UNIADMIN) {
            const [classes, _] = await this.classRepo.findAndCount({
                select: {
                    id: true,
                    join_code: true,
                    label: true,
                    description: true,
                    subject: true,
                    created_approval: true,
                    required_approval: true,
                    required_join_form: true,
                    is_deleted: true,
                    is_banned: true,
                    created_at: true,
                    updated_at: true,
                    createdBy: true
                },
                relations: {
                    members: {
                        user: true
                    },
                    createdBy: true
                },
                where: search ? [
                    {
                        label: Raw((alias) => `(
                            unaccent(${alias}) ILIKE unaccent(:search) OR
                            unaccent(subject) ILIKE unaccent(:search)
                        )`, { search: `%${search}%` })
                    },
                    { members: { user: { full_name: ILike(`%${search}%`) } } },
                    { members: { user: { email: ILike(`%${search}%`) } } }
                ] : {},
                order: {
                    created_at: 'DESC'
                },
                take: pageSize,
                skip: (Number.parseInt(page) - 1) * pageSize
            })

            handledClasses = classes.map((c: Classes) => {
                const ownerMember = c.members.find(m => m.role === RoomRole.ROOMADMIN);
                const userInClass = c.members.find(m => m.user.id === userId)
                const { members, ...classData } = {
                    ...c,
                    roleClass: userInClass ? userInClass.role : null,
                    createdBy: {
                        id: c.createdBy.id,
                        full_name: c.createdBy.full_name,
                        email: c.createdBy.email,
                        role: c.createdBy.role
                    },
                    counts: {
                        student: c.members.filter(m => m.role === RoomRole.STUDENT && m.roomadmin_approved).length,
                        lecturer: c.members.filter(m => m.role === RoomRole.LECTURER && m.roomadmin_approved).length,
                        committee: c.members.filter(m => m.role === RoomRole.LECTURER && m.is_committee_member && m.roomadmin_approved).length,
                        pending: c.members.filter(m => !m.roomadmin_approved).length
                    },
                    owner: ownerMember ? {
                        full_name: ownerMember.user.full_name,
                        email: ownerMember.user.email
                    } : null
                }


                return classData
            })

        } else {
            if (!userId) throw new BadRequestException("Bad request")

            const userExistance = await this.userRepo.findOne({ where: { id: userId } })

            if (!userExistance) throw new NotFoundException("User not found")

            const userClasses = (await this.classRepo.find({
                select: { id: true },
                where: {
                    members: { user: { id: userId } },
                    is_deleted: false
                }
            })).flatMap(user => user.id)

            const [classes, _] = await this.classRepo.findAndCount({
                join: {
                    alias: "class",
                    leftJoinAndSelect: {
                        members: 'class.members',
                        user: 'members.user',
                        createdBy: 'class.createdBy'
                    }
                },
                select: {
                    id: true,
                    join_code: true,
                    label: true,
                    description: true,
                    subject: true,
                    created_approval: true,
                    required_approval: true,
                    required_join_form: true,
                    is_deleted: true,
                    is_banned: true,
                    created_at: true,
                    updated_at: true,
                    createdBy: true
                },
                where: search ? [
                    {
                        id: In(userClasses),
                        is_deleted: false,
                        label: Raw((alias) => `(
                            unaccent(${alias}) ILIKE unaccent(:search) OR
                            unaccent(subject) ILIKE unaccent(:search)
                        )`, { search: `%${search}%` })
                    },
                    {
                        id: In(userClasses),
                        is_deleted: false,
                        members: { user: { full_name: ILike(`%${search}%`) } }
                    },
                    {
                        id: In(userClasses),
                        is_deleted: false,
                        members: { user: { email: ILike(`%${search}%`) } }
                    }
                ] : {
                    id: In(userClasses),
                    is_deleted: false,
                },
                order: {
                    created_at: 'DESC'
                },
                take: pageSize,
                skip: (Number.parseInt(page) - 1) * pageSize
            })

            handledClasses = classes.map((c: Classes) => {
                const ownerMember = c.members.find(m => m.role === RoomRole.ROOMADMIN);
                const userInClass = c.members.find(m => m.user.id === userId)
                const { members, ...classData } = {
                    ...c,
                    roleClass: userInClass ? userInClass.role : null,
                    createdBy: {
                        id: c.createdBy.id,
                        full_name: c.createdBy.full_name,
                        email: c.createdBy.email,
                        role: c.createdBy.role
                    },
                    counts: {
                        student: c.members.filter(m => m.role === RoomRole.STUDENT && m.roomadmin_approved).length,
                        lecturer: c.members.filter(m => m.role === RoomRole.LECTURER && m.roomadmin_approved).length,
                        committee: c.members.filter(m => m.role === RoomRole.LECTURER && m.is_committee_member && m.roomadmin_approved).length,
                        pending: c.members.filter(m => !m.roomadmin_approved).length
                    },
                    owner: ownerMember ? {
                        full_name: ownerMember.user.full_name,
                        email: ownerMember.user.email
                    } : null
                }

                return classData
            })
        }


        return {
            data: handledClasses,
            pagination: {
                page: Number.parseInt(page),
                size: pageSize,
                total_classes: handledClasses.length,
                totalPage: Math.ceil(handledClasses.length / pageSize)
            }
        }
    }

    // Get one class
    async getOneClass(query: { classId: string }, req: Request | any) {
        const { classId } = query
        if (!classId) throw new BadRequestException("Bad request")
        const userData = req.userData
        const classExistance = await this.classRepo.findOne({
            where: { id: classId, members: { user: { email: userData.email, id: userData.id } } },
            relations: { members: { user: true } }
        })

        if (!classExistance) throw new NotFoundException("Class not found")

        const userId = req.userData.id

        const userClasses = (await this.classRepo.find({
            select: { id: true },
            where: {
                members: { user: { id: userId } },
                is_deleted: false
            }
        })).flatMap(user => user.id)

        const [classes, _] = await this.classRepo.findAndCount({
            select: {
                id: true,
                join_code: true,
                label: true,
                description: true,
                subject: true,
                created_approval: true,
                required_approval: true,
                required_join_form: true,
                is_deleted: true,
                is_banned: true,
                created_at: true,
                updated_at: true,
                createdBy: true
            },
            relations: {
                members: {
                    user: true
                },
                createdBy: true
            },
            where: {
                id: In(userClasses.filter(id => id === classId))
            },
            order: {
                created_at: 'DESC'
            },

        })

        const handledClasses = classes.map((c: Classes) => {
            const ownerMember = c.members.find(m => m.role === RoomRole.ROOMADMIN);
            const userInClass = c.members.find(m => m.user.id === userId)
            const { members, ...classData } = {
                ...c,
                roleClass: userInClass ? userInClass.role : null,
                createdBy: {
                    id: c.createdBy.id,
                    full_name: c.createdBy.full_name,
                    email: c.createdBy.email,
                    role: c.createdBy.role
                },
                counts: {
                    student: c.members.filter(m => m.role === RoomRole.STUDENT && m.roomadmin_approved).length,
                    lecturer: c.members.filter(m => m.role === RoomRole.LECTURER && m.roomadmin_approved).length,
                    committee: c.members.filter(m => m.role === RoomRole.LECTURER && m.is_committee_member && m.roomadmin_approved).length,
                    pending: c.members.filter(m => !m.roomadmin_approved).length
                },
                owner: ownerMember ? {
                    full_name: ownerMember.user.full_name,
                    email: ownerMember.user.email
                } : null
            }


            return classData
        })

        console.log(handledClasses)

        return handledClasses[0]
    }

    // Get member in one class
    async getMember(query: { classId: string }, req: Request | any) {
        const { classId } = query

        if (!classId) throw new BadRequestException("Bad request")
        const userData = req.userData
        const classExistance = await this.classRepo.findOne({ where: { id: classId, members: { user: { email: userData.email } } } })

        if (!classExistance) throw new NotFoundException("Class not found")

        const getAllMember = await this.classMemberRepo.find({
            where: { class: { id: classId } },
            relations: ['user'],
            select: {
                user: { id: true, email: true, full_name: true }
            }
        })
        return getAllMember
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
            const newClass = this.classRepo.create({
                join_code: joinCode,
                label, subject,
                description: description ? description : undefined,
                created_approval: false,
                required_approval: true,
                createdBy: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
            })

            await this.classRepo.save(newClass)

            const newMember = this.classMemberRepo.create({
                role: RoomRole.ROOMADMIN,
                class: newClass,
                roomadmin_approved: true,
                user: user
            })

            await this.classMemberRepo.save(newMember)

            const newClassResponse = {
                ...newClass,
                roleClass: RoomRole.ROOMADMIN,
                counts: {
                    student: 0,
                    lecturer: 0,
                    committee: 0,
                    pending: 0
                },
                owner: {
                    full_name: user.full_name,
                    email: user.email
                }
            }

            return newClassResponse

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

        const [classes, _] = await this.classRepo.findAndCount({
            select: {
                id: true,
                join_code: true,
                label: true,
                description: true,
                subject: true,
                created_approval: true,
                required_approval: true,
                required_join_form: true,
                is_deleted: true,
                is_banned: true,
                created_at: true,
                updated_at: true,
                createdBy: true
            },
            relations: {
                members: {
                    user: true
                },
                createdBy: true
            },
            where: {
                is_deleted: false,
                id: classExistance.id
            },
            order: {
                created_at: 'DESC'
            },
        })

        const handledClasses = classes.map((c: Classes) => {
            const ownerMember = c.members.find(m => m.role === RoomRole.ROOMADMIN);
            const userInClass = c.members.find(m => m.user.id === userId)
            const { members, ...classData } = {
                ...c,
                roleClass: userInClass ? userInClass.role : null,
                createdBy: {
                    id: c.createdBy.id,
                    full_name: c.createdBy.full_name,
                    email: c.createdBy.email,
                    role: c.createdBy.role
                },
                counts: {
                    student: c.members.filter(m => m.role === RoomRole.STUDENT && m.roomadmin_approved).length,
                    lecturer: c.members.filter(m => m.role === RoomRole.LECTURER && m.roomadmin_approved).length,
                    committee: c.members.filter(m => m.role === RoomRole.LECTURER && m.is_committee_member && m.roomadmin_approved).length,
                    pending: c.members.filter(m => !m.roomadmin_approved).length
                },
                owner: ownerMember ? {
                    full_name: ownerMember.user.full_name,
                    email: ownerMember.user.email
                } : null
            }

            return classData
        })

        return handledClasses[0]
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
