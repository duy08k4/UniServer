import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { CreateClassDTO, GetClassDTO, GetMembersDTO, JoinClassDTO, RemoveClassDTO, RemoveMemberDTO, UpdateClassDTO, UpdateCommitteeDTO, updateMemberInClassDTO } from "./classes.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/user.en";
import { Brackets, DataSource, ILike, In, Or, Raw, Repository } from "typeorm";
import { Classes } from "src/entities/classes.en";
import { nanoid } from "nanoid";
import { ClassGateway } from "./class.gateway";
import { ClassMembers } from "src/entities/class_members.en";
import { MainRole, Role, RoomRole } from "src/enums/enums";
import { GlobalGateway } from "../socket/socketGlobal.gateway";
import { Submissions } from "src/entities/submissions.en";
import { ScoreFormCells } from "src/entities/score_form_cells.en";

@Injectable()
export class ClassesService {
    constructor(
        private dataSource: DataSource,
        private readonly classGateway: ClassGateway,
        private readonly globalGateway: GlobalGateway,
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
        @InjectRepository(Classes)
        private readonly classRepo: Repository<Classes>,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
        @InjectRepository(Submissions)
        private readonly submissionRepo: Repository<Submissions>,
        @InjectRepository(ScoreFormCells)
        private readonly scoreCellRepo: Repository<ScoreFormCells>
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

        if (userRole === MainRole.UNIADMIN) {
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
                    user: {
                        role: userInClass?.role,
                        is_banned: userInClass?.is_banned,
                        roomadmin_approved: userInClass?.roomadmin_approved
                    },
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
            })).flatMap(c => c.id)

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
                    user: {
                        role: userInClass?.role,
                        is_banned: userInClass?.is_banned,
                        roomadmin_approved: userInClass?.roomadmin_approved
                    },
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
        const { classId } = query;
        const userId = req.userData.id;

        const classData = await this.classRepo.findOne({
            where: {
                id: classId,
                is_deleted: false,
            },
            relations: {
                members: { user: true },
                createdBy: true
            }
        });

        if (!classData) throw new NotFoundException("Class not found or access denied");

        const ownerMember = classData.members.find(m => m.role === RoomRole.ROOMADMIN);
        const userInClass = classData.members.find(m => m.user.id === userId);

        return {
            id: classData.id,
            join_code: classData.join_code,
            label: classData.label,
            description: classData.description,
            subject: classData.subject,
            created_approval: classData.created_approval,
            required_approval: classData.required_approval,
            required_join_form: classData.required_join_form,
            is_deleted: classData.is_deleted,
            is_banned: classData.is_banned,
            created_at: classData.created_at,
            updated_at: classData.updated_at,
            user: {
                role: userInClass ? String(userInClass.role) : "",
                is_banned: userInClass?.is_banned ?? false,
                roomadmin_approved: userInClass?.roomadmin_approved ?? false
            },
            createdBy: {
                id: classData.createdBy.id,
                full_name: classData.createdBy.full_name,
                email: classData.createdBy.email,
                role: classData.createdBy.role
            },
            counts: {
                student: classData.members.filter(m => m.role === RoomRole.STUDENT && m.roomadmin_approved).length,
                lecturer: classData.members.filter(m => m.role === RoomRole.LECTURER && m.roomadmin_approved).length,
                committee: classData.members.filter(m => m.role === RoomRole.LECTURER && m.is_committee_member && m.roomadmin_approved).length,
                pending: classData.members.filter(m => !m.roomadmin_approved).length
            },
            owner: ownerMember ? {
                full_name: ownerMember.user.full_name,
                email: ownerMember.user.email
            } : null
        };
    }

    // Get member in one class
    async getMember(query: GetMembersDTO, req: Request | any) {
        const { classId, page, size, search, roleSearch } = query

        if (!page || !classId) throw new BadRequestException("Data is invalid")
        const userEmail = req.userData.email
        const userRole = req.role

        const classExistance = await this.classRepo.findOne({
            where: {
                id: classId,
                members: userRole === Role.USER ? {
                    user: { email: userEmail }
                } : {}
            }
        })

        if (!classExistance) throw new NotFoundException("Class not found")

        const pageSize = size ? Number.parseInt(size) : 50

        const members = await this.classMemberRepo.find({
            relations: {
                user: true
            },
            select: {
                ...({
                    user: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                })
            },

            where: search || roleSearch ? {
                class: { id: classId },
                user: {
                    email: Raw((alias) => `(
                        unaccent(${alias}) ILIKE unaccent(:search) OR
                        unaccent(full_name) ILIKE unaccent(:search)
                    )`, { search: `%${search}%` })
                },
                role: roleSearch
            } : { class: { id: classId } },
            order: {
                user: { full_name: "ASC" }
            },
            take: pageSize,
            skip: (Number.parseInt(page) - 1) * pageSize
        })

        const sortMembers: Record<RoomRole | 'pending', ClassMembers[]> = {
            lecturer: [],
            student: [],
            roomadmin: [],
            pending: []
        }

        members.forEach(m => {
            if (!m.roomadmin_approved) {
                sortMembers.pending.push(m)
            } else {
                switch (m.role) {
                    case RoomRole.ROOMADMIN:
                        sortMembers.roomadmin.push(m)
                        break;

                    case RoomRole.LECTURER:
                        sortMembers.lecturer.push(m)
                        break;

                    default:
                        sortMembers.student.push(m)
                        break;
                }
            }
        })

        return {
            data: sortMembers,
            pagination: {
                page: Number.parseInt(page),
                size: pageSize,
                total_members: members.length,
                totalPage: Math.ceil(members.length / pageSize)
            }
        }
    }

    // Create a new class
    async createNewClass(dto: CreateClassDTO, req: Request | any) {
        try {
            const { label, subject, description } = dto

            if (!label || !subject) throw new BadRequestException("Bad request")

            // Check user existance     
            const userEmail = req.userData.email
            const user = await this.userRepo.findOne({ where: { email: userEmail } })
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
                can_create_forms: true,
                can_create_notifications: true,
                can_create_score_forms: true,
                user: user
            })

            await this.classMemberRepo.save(newMember)

            const newClassResponse = {
                ...newClass,
                roleClass: RoomRole.ROOMADMIN,
                user: {
                    role: RoomRole.ROOMADMIN,
                    is_banned: false,
                    roomadmin_approved: true
                },
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
    async removeClass(query: RemoveClassDTO, req: Request | any) {
        try {
            const { classId, userId } = query

            if (!classId || !userId) throw new BadRequestException("Bad request")


            const clientRole: Role = req.role
            if (clientRole !== Role.UNIADMIN) {
                const userExistance = await this.classMemberRepo.findOne({
                    where: {
                        user: { id: userId },
                        class: { id: classId }
                    }
                })
                console.log(userExistance)
                if (!userExistance) throw new NotFoundException("User not found")
                const memberRole = userExistance.role

                if (memberRole !== RoomRole.ROOMADMIN) throw new ForbiddenException("Forbidden - Access denied")
            }

            const [submissionCount, cellCount] = await Promise.all([
                this.submissionRepo.count({ where: { form: { class: { id: classId } } } }),
                this.scoreCellRepo.count({ where: { score_form: { class: { id: classId } } } })
            ]);

            const hasSignificantData = submissionCount > 0 || cellCount > 0;

            if (!hasSignificantData) {
                // Hard deletion if there is not data
                await this.classRepo.delete(classId);
            } else {
                // Soft deletion if there is data
                await this.classRepo.update(classId, { is_deleted: true });
            }

            this.classGateway.dissolveClass({
                classId,
                removeByRole: clientRole === Role.UNIADMIN ? Role.UNIADMIN : RoomRole.ROOMADMIN
            })

            return true

        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Join to a class
    async joinClass(joinClassDto: JoinClassDTO, req: Request | any) {
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
                user: {
                    role: userInClass?.role,
                    is_banned: userInClass?.is_banned,
                    roomadmin_approved: userInClass?.roomadmin_approved
                },
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
                owner: {
                    full_name: ownerMember?.user.full_name,
                    email: ownerMember?.user.email
                }
            }

            return classData
        })
        const client = req.userData
        this.globalGateway.joinClass({
            classId: handledClasses[0].id,
            newMemberEmail: userExistance.email,
            newMemberId: userExistance.id,
            newMemberName: userExistance.full_name,
            receiverEmail: handledClasses[0].owner.email as string
        })

        return handledClasses[0]
    }

    // Update some information in class
    async updateClass(query: UpdateClassDTO, req: Request | any) {
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



            return await this.getOneClass({ classId }, req)
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    // Remove member
    async removeMember(query: RemoveMemberDTO, req: Request | any) {
        const { userId, classId, newOwnerId } = query;

        const memberInClass = await this.classMemberRepo.findOne({
            where: {
                user: { id: userId },
                class: { id: classId }
            },
            relations: { user: true }
        })

        if (!memberInClass) throw new NotFoundException("Member not found")

        if (memberInClass.role === RoomRole.ROOMADMIN) {
            if (!newOwnerId || newOwnerId === userId) throw new BadRequestException("New owner required")

            const newOwner = await this.classMemberRepo.findOne({
                where: {
                    user: { id: newOwnerId },
                    class: { id: classId }
                }
            })

            if (!newOwner) throw new NotFoundException("New owner not found")

            await this.dataSource.transaction(async (manager) => {
                await manager.update(ClassMembers, { id: newOwner.id, class: { id: classId } }, {
                    role: RoomRole.ROOMADMIN,
                    can_create_forms: true,
                    can_create_notifications: true,
                    can_create_score_forms: true,
                    roomadmin_approved: true,
                })

                await manager.delete(ClassMembers, { id: memberInClass.id, class: { id: classId } })
            })
        } else {
            await this.classMemberRepo.delete({ id: memberInClass.id })
        }

        let removeByRole: Role | RoomRole
        const clientRole: Role = req.role
        const client = req.userData

        if (clientRole === Role.UNIADMIN) {
            removeByRole = Role.UNIADMIN
        } else {
            if (client.email === memberInClass.user.email) {
                removeByRole = memberInClass.role;
            } else {
                removeByRole = RoomRole.ROOMADMIN;
            }
        }

        this.classGateway.leaveTheClass({
            classId,
            userId,
            role: memberInClass.role,
            removeByRole,
            roomadmin_approved: memberInClass.roomadmin_approved,
            newOwnerId: newOwnerId
        })

        return true
    }

    // Update member in class
    async updateMemberInClass(query: updateMemberInClassDTO, req: Request | any) {
        const clientRole = req.role
        const { classId, memberId, role, can_create_forms, can_create_notifications, can_create_score_forms, roomadmin_approved, is_banned } = query

        if (clientRole === MainRole.USER) {
            const clientEmail = req.userData.email
            const isRoomAdmin = await this.classRepo.findOne({
                where: {
                    id: classId,
                    members: {
                        role: RoomRole.ROOMADMIN,
                        user: { email: clientEmail }
                    }
                }
            })

            if (!isRoomAdmin) throw new ForbiddenException("Access denied")
        }

        if (!classId || !memberId) throw new BadRequestException("Bad request")

        const classExistance = await this.classRepo.findOne({ where: { id: classId } })
        if (!classExistance) throw new NotFoundException("Class not found")

        const memberExistance = await this.classMemberRepo.findOne({ where: { user: { id: memberId }, class: { id: classId } } })
        if (!memberExistance) throw new NotFoundException("User not found in class")

        const dataUpdate: any = {}

        if (role !== undefined && role !== null) dataUpdate.role = role
        if (can_create_forms !== undefined && can_create_forms !== null) dataUpdate.can_create_forms = can_create_forms
        if (can_create_notifications !== undefined && can_create_notifications !== null) dataUpdate.can_create_notifications = can_create_notifications
        if (can_create_score_forms !== undefined && can_create_score_forms !== null) dataUpdate.can_create_score_forms = can_create_score_forms
        if (roomadmin_approved !== undefined && roomadmin_approved !== null) {

            if (memberExistance.roomadmin_approved === !roomadmin_approved) {
                dataUpdate.roomadmin_approved = roomadmin_approved
                dataUpdate.joined_at = new Date()
            }
        }
        if (is_banned !== undefined && is_banned !== null) dataUpdate.is_banned = is_banned

        if (Object.values(dataUpdate).length === 0) throw new BadRequestException("No data for update")
        await this.dataSource.transaction(async (manager) => {
            if (role === RoomRole.ROOMADMIN) {
                await manager.update(
                    ClassMembers,
                    {
                        class: { id: classId },
                        role: RoomRole.ROOMADMIN
                    },
                    {
                        role: RoomRole.STUDENT
                    }
                )
            }

            await manager.update(
                ClassMembers,
                {
                    class: { id: classId },
                    user: { id: memberId },
                },
                dataUpdate
            )
        })

        const getUser = await this.classMemberRepo.findOne({
            relations: {
                user: true
            },
            select: {
                ...({
                    user: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                })
            },
            where: {
                class: { id: classId },
                user: { id: memberId }
            }
        })

        if (is_banned !== undefined && is_banned !== null) {
            if (is_banned !== memberExistance.is_banned) {
                this.classGateway.suspendMember({
                    classId: classExistance.id,
                    memberId,
                    result: is_banned
                })
            }
        }

        if (roomadmin_approved !== undefined && roomadmin_approved !== null) {
            if (memberExistance.roomadmin_approved === !roomadmin_approved) {
                this.globalGateway.approveMember({
                    receiver: memberId,
                    classId: classExistance.id,
                    result: true
                })
            }
        }

        return getUser
    }
}
