import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { CLASS_LIMITS } from "src/config/class-limits";
import { CreateClassDTO, GetClassDTO, GetJoinFormDTO, GetMembersDTO, JoinClassDTO, RemoveClassDTO, RemoveMemberDTO, UpdateClassDTO, UpdateCommitteeDTO, updateMemberInClassDTO } from "./classes.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/user.en";
import { DataSource, ILike, In, Raw, Repository } from "typeorm";
import { Classes } from "src/entities/classes.en";
import { nanoid } from "nanoid";
import { ClassGateway } from "./class.gateway";
import { ClassMembers } from "src/entities/class_members.en";
import { MainRole, Role, RoomRole } from "src/enums/enums";
import { GlobalGateway } from "../socket/socketGlobal.gateway";
import { Submissions } from "src/entities/submissions.en";
import { ScoreFormCells } from "src/entities/score_form_cells.en";
import { Forms } from "src/entities/forms.en";
import { ScoreFormsService } from "../scoreforms/scoreforms.service";

@Injectable()
export class ClassesService {
    constructor(
        private dataSource: DataSource,
        private readonly classGateway: ClassGateway,
        private readonly globalGateway: GlobalGateway,
        private readonly scoreFormsService: ScoreFormsService,
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
        @InjectRepository(Classes)
        private readonly classRepo: Repository<Classes>,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
        @InjectRepository(Submissions)
        private readonly submissionRepo: Repository<Submissions>,
        @InjectRepository(ScoreFormCells)
        private readonly scoreCellRepo: Repository<ScoreFormCells>,
        @InjectRepository(Forms)
        private readonly formRepo: Repository<Forms>
    ) { }

    // Get join form
    async getJoinForm(query: GetJoinFormDTO) {
        const { joinCode } = query

        const cls = await this.classRepo.findOne({ where: { join_code: joinCode } })
        if (!cls) throw new NotFoundException("Class not found")

        const willBePending = cls.required_approval

        let isFull = false
        if (willBePending) {
            const pendingCount = await this.classMemberRepo.count({
                where: { class: { id: cls.id }, roomadmin_approved: false }
            })
            isFull = pendingCount >= CLASS_LIMITS.MAX_PENDING
        } else {
            const approvedCount = await this.classMemberRepo.count({
                where: { class: { id: cls.id }, roomadmin_approved: true }
            })
            isFull = approvedCount >= CLASS_LIMITS.MAX_MEMBERS
        }

        if (!cls.required_join_form) return { classId: cls.id, formId: null, isFull }

        const form = await this.formRepo.findOne({
            where: { class: { id: cls.id }, is_join_form: true, is_deleted: false }
        })

        return { classId: cls.id, formId: form?.id ?? null, isFull }
    }

    // Get class
    async getClass(query: GetClassDTO, req: Request | any) {
        const { userId, page, size, search } = query

        if (!page) throw new BadRequestException("Bad request")

        const pageSize = size ? Number.parseInt(size) : 20
        const userRole = req.role
        let handledClasses

        if (userRole === MainRole.UNIADMIN) {
            const [classes, total] = await this.classRepo.findAndCount({
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

            return {
                data: handledClasses,
                pagination: {
                    page: Number.parseInt(page),
                    size: pageSize,
                    total_classes: total,
                    totalPage: Math.ceil(total / pageSize)
                }
            }

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

            const [classes, total] = await this.classRepo.findAndCount({
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

            return {
                data: handledClasses,
                pagination: {
                    page: Number.parseInt(page),
                    size: pageSize,
                    total_classes: total,
                    totalPage: Math.ceil(total / pageSize)
                }
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

        const [{ forms_count, milestones_count, score_forms_count }] = await this.dataSource.query(`
            SELECT
                (SELECT COUNT(*) FROM forms WHERE class = $1 AND is_deleted = false) AS forms_count,
                (SELECT COUNT(*) FROM milestones m JOIN progresses p ON m.progress = p.id WHERE p.class = $1 AND m.is_deleted = false) AS milestones_count,
                (SELECT COUNT(*) FROM score_forms WHERE class = $1 AND is_deleted = false) AS score_forms_count
        `, [classId])

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
                pending: classData.members.filter(m => !m.roomadmin_approved).length,
                forms: Number(forms_count),
                milestones: Number(milestones_count),
                score_forms: Number(score_forms_count)
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
        const currentPage = Number.parseInt(page)

        const [members, total] = await this.classMemberRepo.findAndCount({
            relations: {
                user: true
            },
            select: {
                id: true,
                role: true,
                roomadmin_approved: true,
                is_banned: true,
                is_deleted: true,
                is_committee_member: true,
                joined_at: true,
                updated_at: true,
                created_at: true,
                user: {
                    id: true,
                    full_name: true,
                    email: true
                }
            },
            where: (search && roleSearch) ? [
                {
                    class: { id: classId },
                    user: {
                        email: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` })
                    },
                    role: roleSearch
                },
                {
                    class: { id: classId },
                    user: {
                        full_name: Raw(() => `unaccent(full_name) ILIKE unaccent(:search)`, { search: `%${search}%` })
                    },
                    role: roleSearch
                }
            ] : search ? [
                {
                    class: { id: classId },
                    user: {
                        email: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` })
                    },
                },
                {
                    class: { id: classId },
                    user: {
                        full_name: Raw(() => `unaccent(full_name) ILIKE unaccent(:search)`, { search: `%${search}%` })
                    },
                }
            ] : roleSearch ? { class: { id: classId }, role: roleSearch }
                : { class: { id: classId } },
            order: {
                joined_at: "ASC"
            },
            take: pageSize,
            skip: (currentPage - 1) * pageSize
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
                page: currentPage,
                size: pageSize,
                total_members: total,
                totalPage: Math.ceil(total / pageSize)
            }
        }
    }

    // Create a new class
    async createNewClass(dto: CreateClassDTO, req: Request | any) {
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
            required_join_form: true,
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

        this.globalGateway.createNewClass({ classId: newClass.id })

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
    }

    // Remove a class
    async removeClass(query: RemoveClassDTO, req: Request | any) {
        const { classId, userId } = query

        if (!classId || !userId) throw new BadRequestException("Bad request")


        const clientRole: Role = req.role
        console.log(clientRole)
        if (clientRole !== Role.UNIADMIN) {
            const userExistance = await this.classMemberRepo.findOne({
                where: {
                    user: { id: userId },
                    class: { id: classId }
                }
            })

            if (!userExistance) throw new NotFoundException("User not found")
            const memberRole = userExistance.role

            if (memberRole !== RoomRole.ROOMADMIN) throw new ForbiddenException("Forbidden - Access denied")
        } else {
            await this.classRepo.delete(classId);
            this.classGateway.removeClass({ classId })
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

        const willBePending = classExistance.required_approval

        if (willBePending) {
            const pendingCount = await this.classMemberRepo.count({
                where: { class: { id: classExistance.id }, roomadmin_approved: false }
            })
            if (pendingCount >= CLASS_LIMITS.MAX_PENDING) throw new BadRequestException("Lớp học đã đạt giới hạn số lượng yêu cầu chờ duyệt (150)")
        } else {
            const approvedCount = await this.classMemberRepo.count({
                where: { class: { id: classExistance.id }, roomadmin_approved: true }
            })
            if (approvedCount >= CLASS_LIMITS.MAX_MEMBERS) throw new BadRequestException("Lớp học đã đạt giới hạn thành viên (150)")

            if (joinRole === RoomRole.STUDENT) {
                const studentCount = await this.classMemberRepo.count({
                    where: { class: { id: classExistance.id }, role: RoomRole.STUDENT, roomadmin_approved: true }
                })
                if (studentCount >= CLASS_LIMITS.MAX_STUDENTS) throw new BadRequestException("Lớp học đã đạt giới hạn sinh viên (50)")
            }

            if (joinRole === RoomRole.LECTURER) {
                const lecturerCount = await this.classMemberRepo.count({
                    where: { class: { id: classExistance.id }, role: RoomRole.LECTURER, roomadmin_approved: true }
                })
                if (lecturerCount >= CLASS_LIMITS.MAX_LECTURERS) throw new BadRequestException("Lớp học đã đạt giới hạn giảng viên (99)")
            }
        }

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
        })

        return handledClasses[0]
    }

    // Update some information in class
    async updateClass(query: UpdateClassDTO, req: Request | any) {
        const { classId, userId, label, created_approval, is_banned, description, subject, required_approval, required_join_form } = query

        if (!classId || !userId) throw new BadRequestException("Bad request")

        const classExistance = await this.classRepo.findOne({ where: { id: classId } })

        if (!classExistance) throw new NotFoundException("Class not found")

        const clientRole = req.role

        if (clientRole !== Role.UNIADMIN) {
            const member = await this.classMemberRepo.findOne({ where: { user: { id: userId } } })

            if (!member) throw new NotFoundException("User not found")
            if (member.role !== RoomRole.ROOMADMIN) throw new ForbiddenException("Forbidden - Access denied")
        }

        const updateData: Record<string, any> = {}

        if (label) updateData.label = label
        if (description) updateData.description = description
        if (subject) updateData.subject = subject
        if (typeof required_approval === "boolean") updateData.required_approval = required_approval
        if (typeof required_join_form === "boolean") updateData.required_join_form = required_join_form
        if (typeof created_approval === "boolean") updateData.created_approval = created_approval
        if (typeof is_banned === "boolean") updateData.is_banned = is_banned

        if (typeof created_approval === "boolean" || typeof is_banned === "boolean") {
            this.globalGateway.updateClassStatus({
                classId,
                approvalClass: created_approval,
                banned: is_banned
            })
        }

        if (Object.keys(updateData).length > 0) {
            await this.classRepo.createQueryBuilder()
                .update(Classes)
                .set({ ...updateData })
                .where("id = :id", { id: classId })
                .execute()
        }

        return await this.getOneClass({ classId }, req)

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
        const { classId, memberId, role, roomadmin_approved, is_banned } = query

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

        let dataUpdate: Partial<ClassMembers> = {}

        if (role !== undefined && role !== null) dataUpdate.role = role

        if (role !== RoomRole.ROOMADMIN) {
            if (roomadmin_approved !== undefined && roomadmin_approved !== null) {
                if (memberExistance.roomadmin_approved === !roomadmin_approved) {
                    dataUpdate.roomadmin_approved = roomadmin_approved
                    dataUpdate.joined_at = new Date()
                }
            }
            if (is_banned !== undefined && is_banned !== null) dataUpdate.is_banned = is_banned
        }

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
                        role: RoomRole.STUDENT,
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
                id: true,
                role: true,
                roomadmin_approved: true,
                is_banned: true,
                is_deleted: true,
                is_committee_member: true,
                joined_at: true,
                updated_at: true,
                created_at: true,
                user: {
                    id: true,
                    full_name: true,
                    email: true,
                }
            },
            where: {
                class: { id: classId },
                user: { id: memberId }
            }
        })

        if (role && getUser) {
            this.classGateway.updateMemberData({
                memberId,
                classId,
                role,
            })
        }

        if (is_banned !== undefined && is_banned !== null) {
            if (is_banned !== memberExistance.is_banned) {
                this.classGateway.suspendMember({
                    classId: classExistance.id,
                    memberId,
                    result: is_banned
                })
            }
        }
        console.log(role)
        if (roomadmin_approved !== undefined && roomadmin_approved !== null && getUser && getUser.role) {
            if (memberExistance.roomadmin_approved === !roomadmin_approved) {
                this.globalGateway.approveMember({
                    classId: classExistance.id,
                    result: true,
                    memberId,
                    role: getUser.role
                })

                // Khi SV được duyệt vào lớp → sync rows cho tất cả scoreform trong lớp
                if (roomadmin_approved === true && memberExistance.role === RoomRole.STUDENT) {
                    const scoreForms = await this.dataSource.query(
                        `SELECT id FROM score_forms WHERE class = $1 AND is_deleted = false`,
                        [classId]
                    )
                    for (const sf of scoreForms) {
                        await this.scoreFormsService.syncMissingRows(sf.id, classId)
                    }
                }
            }
        }

        return getUser
    }
}
