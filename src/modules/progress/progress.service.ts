import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MilestoneDTO, MilestonePaginationDTO, NewMilestoneDTO, NewProgressDTO, ProgressPaginationDTO, UpdateProgressDTO } from "./progress.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Progresses } from "src/entities/progresses.en";
import { Brackets, DataSource, In, IsNull, Not, Raw, Repository } from "typeorm";
import { ClassMembers } from "src/entities/class_members.en";
import { Role, RoomRole, SubmissionStatus } from "src/enums/enums";
import { Milestones } from "src/entities/milestones.en";
import { CLASS_MEMBERSHIP_REQUIRED_403 } from "src/config/errorCustom";
import { isUUID } from "class-validator";
import { Topics } from "src/entities/topics.en";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { ProgressGateway } from "./progress.gateway";

@Injectable()
export class ProgressService {
    constructor(
        private readonly progressGateway: ProgressGateway,
        private dataSource: DataSource,
        private readonly configService: ConfigService,
        @InjectRepository(Progresses)
        private readonly progresses: Repository<Progresses>,
        @InjectRepository(ClassMembers)
        private readonly classMembers: Repository<ClassMembers>,
        @InjectRepository(Milestones)
        private readonly milestones: Repository<Milestones>,
        @InjectRepository(Topics)
        private readonly topics: Repository<Topics>,
    ) { }
    // -------------------------------------------------------- PROGRESS --------------------------------------------------------------------
    // Get all progresses (pagination)
    async progressPagination(query: ProgressPaginationDTO, req: Request | any) {
        const client = req.userData

        if (client.role !== Role.UNIADMIN) throw new ForbiddenException("Access denied")

        const { page, size, search, created_approval, is_banned, is_deleted } = query

        if (!page || !size) return new BadRequestException("Data is invalid")

        const [progresses, total] = await this.progresses.findAndCount({
            select: {
                milestones: { id: true },
                class: {
                    id: true,
                    label: true,
                    subject: true,
                    join_code: true
                },
                createdBy: {
                    id: true,
                    full_name: true,
                    email: true
                }
            },
            relations: {
                milestones: true,
                class: true,
                createdBy: true
            },
            where: search
                ? [
                    {
                        created_approval, is_banned, is_deleted,
                        label: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` })
                    },
                    {
                        created_approval, is_banned, is_deleted,
                        createdBy: [
                            { full_name: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` }) },
                            { email: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` }) }
                        ]
                    },
                    {
                        created_approval, is_banned, is_deleted,
                        class: [
                            { label: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` }) },
                            { subject: Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` }) }
                        ]
                    }
                ]
                : {
                    created_approval, is_banned, is_deleted
                },
            order: {
                created_at: "DESC"
            },
            take: Number(size),
            skip: (Number.parseInt(page) - 1) * Number(size)

        })

        const progressList = progresses.map(p => {
            return {
                ...p,
                milestones: p.milestones.length
            }
        })

        return {
            data: progressList,
            pagination: {
                page: Number(page),
                size: Number(size),
                total_progress: total,
                total_page: Math.ceil(total / Number(size))
            }
        }
    }

    // Get one progress
    async getOneProgress(query: { classId: string }, req: Request | any) {
        const { classId } = query

        if (!classId || !req) throw new BadRequestException("Data is invalid")

        const progress = await this.progresses.findOne({
            select: {
                class: {
                    id: true,
                    label: true,
                    subject: true,
                    join_code: true
                },
                createdBy: {
                    id: true,
                    full_name: true,
                    email: true
                }
            },
            relations: { class: true, createdBy: true, milestones: true },
            where: {
                class: { id: classId },
                milestones: { is_deleted: false }
            },
            order: {
                milestones: {
                    index: "ASC"
                }
            }
        })

        if (!progress) throw new NotFoundException("Progress not found")

        return progress
    }

    // Create a new progress (Only one progress in a class) (roomadmin + uniadmin)
    async createNewProgress(newProgressDTO: NewProgressDTO, req: Request | any) {
        const { classId, description, label } = newProgressDTO

        if (!classId || !description || !label || !req) throw new BadRequestException("Data is invalid")

        // Check user role (only roomadmin)
        const client = req.userData
        const clientRole = req.role

        /*
            Condition to create a prgress
            - Only the sytem admin and owner's class have permission to create
            - If the creator is owner's class:
                + The class must exist and must not be soft-deleted or banned.
                + The class has been approved.
        */

        if (clientRole !== Role.UNIADMIN) {
            const canCreateProgress = await this.classMembers.findOne({
                where: {
                    class: { id: classId, is_deleted: false, is_banned: false, created_approval: true },
                    user: { id: client.id },
                    role: RoomRole.ROOMADMIN
                }
            })

            if (!canCreateProgress) throw new ForbiddenException("You don't have permission to create a progress")
        }

        // One class only has one progress => Check progress
        const anyProgressExistance = await this.progresses.findOne({
            where: {
                class: { id: classId }
            }
        })

        if (anyProgressExistance) throw new ConflictException("One progress is already existed in the class")

        const newProgress = this.progresses.create({
            label: label,
            description: description,
            class: { id: classId },
            createdBy: { id: client.id }
        })

        await this.progresses.save(newProgress)

        await this.milestones.save(this.milestones.create({
            index: 0,
            label: "Đăng ký đề tài",
            is_registration_milestone: true,
            progress: { id: newProgress.id },
            createdBy: { id: client.id }
        }))

        const getProgress = await this.progresses.findOne({
            select: {
                class: {
                    id: true,
                    label: true,
                    subject: true,
                    join_code: true
                },
                createdBy: {
                    id: true,
                    full_name: true,
                    email: true
                }
            },
            relations: {
                class: true,
                createdBy: true
            },
            where: {
                class: { id: classId },
                createdBy: { id: client.id }
            }
        })

        return getProgress
    }

    // Update progress
    async updateProgress(updateProgressDTO: UpdateProgressDTO, req: Request | any) {
        const { classId, progressId, label, description, is_submitted, created_approval, is_banned, is_deleted } = updateProgressDTO

        if (!classId || !progressId || (!label && !description && typeof is_submitted !== "boolean" && typeof created_approval !== "boolean" && typeof is_banned !== "boolean" && typeof is_deleted !== "boolean")) throw new BadRequestException("Data is invalid")

        const progressExistance = await this.progresses.findOne({
            where: {
                id: progressId,
                class: {
                    id: classId
                }
            }
        })

        if (!progressExistance) throw new NotFoundException("Progress not found")

        let dataUpdate: any = {}

        /*
            Note: Only system admin can approve creation, ban and perform soft-delete
        */
        if (typeof created_approval === "boolean" || typeof is_banned === "boolean" || typeof is_deleted === "boolean") {
            const clientRole = req.role

            if (clientRole !== Role.UNIADMIN) throw new ForbiddenException("Access denied")

            if (typeof created_approval === "boolean") dataUpdate.created_approval = created_approval
            if (typeof is_banned === "boolean") dataUpdate.is_banned = is_banned
            if (typeof is_deleted === "boolean") dataUpdate.is_deleted = is_deleted

        }

        if (label) dataUpdate.label = label
        if (description) dataUpdate.description = description
        if (typeof is_submitted === "boolean") dataUpdate.is_submitted = is_submitted

        if (Object.values(dataUpdate).length === 0) throw new BadRequestException("No data to update")

        await this.progresses.update(
            { id: progressId, class: { id: classId } },
            dataUpdate
        )

        // Socket
        this.progressGateway.updateProgress({ classId })

        return await this.getOneProgress({ classId }, req)
    }

    // Remove progress (soft deletion or hard deletion)
    async removeProgress(ids: string[], req: Request | any) {
        const client = req.userData
        const clientRole = req.role
        let filterProgressId = ids.filter(id => id.trim() !== "")

        if (filterProgressId.length === 0) throw new BadRequestException("Data is invalid")

        /*
            Only system admin and owner's class:
                + The system admin can remove more progress
                + Owner's class can only remove the progress in their class. Only one progress because the owners is only created one progress in their class. 
        
        */
        if (clientRole !== Role.UNIADMIN) {
            if (filterProgressId.length > 1) throw new ForbiddenException("You cannot delete multiple progresses at once.")
            const isOwner = await this.progresses.findOne({
                where: {
                    id: filterProgressId[0],
                    class: {
                        members: {
                            role: RoomRole.ROOMADMIN,
                            user: {
                                id: client.id
                            }
                        }
                    }
                }
            })

            if (!isOwner) throw new ForbiddenException("Access denied")
        }

        /*
            Note:
            - Nếu có submission với trạng thái là "accept" hoặc bảng điểm với trạng thái là "accept" thì xóa mềm.
            - Ngược lại thì xóa cứng.
        */

        // Get all progresses based on the input
        const query = this.progresses.createQueryBuilder("p")
            .select("p.id")
            .where("p.id IN (:...ids)", { ids: filterProgressId })
            .andWhere(new Brackets(global_qb => {

                // Check Submission
                global_qb.where(sub_qb => {
                    const subQuery = sub_qb.subQuery()
                        .select("1")
                        .from("milestones", "m")
                        .innerJoin("m.forms", "f")
                        .innerJoin("f.submissions", "s")
                        // Sử dụng IN với alias của query cha
                        .where("m.progress IN (p.id)")
                        .andWhere("s.status::text = :subStatus")
                        .getQuery();
                    return `EXISTS (${subQuery})`;
                })

                    // Check ScoreForm
                    .orWhere(sub_qb => {
                        const subQuery = sub_qb.subQuery()
                            .select("1")
                            .from("milestones", "m2")
                            .innerJoin("m2.scoreForms", "sf")
                            .where("m2.progress IN (p.id)")
                            .andWhere("sf.status::text = :sfStatus")
                            .getQuery();
                        return `EXISTS (${subQuery})`;
                    });
            }))
            .setParameters({
                subStatus: SubmissionStatus.ACCEPT,
                sfStatus: SubmissionStatus.ACCEPT
            });
        const [soft_deletePogresses, total] = await query.getManyAndCount()


        let softDeletionId = soft_deletePogresses.map(item => item.id)
        const softDeletionIdSet = new Set(softDeletionId)
        const hardDeletionId = filterProgressId.filter(id => !softDeletionIdSet.has(id))

        if (softDeletionId.length > 0) {
            await this.progresses.update(
                { id: In(softDeletionId) },
                { is_deleted: true }
            )
        }

        await this.progresses.delete({
            id: In(hardDeletionId)
        })

        return {
            hard_deleted: hardDeletionId,
            soft_deleted: softDeletionId
        }
    }


    // -------------------------------------------------------- MILESTONE --------------------------------------------------------------------
    // Get all milestones (pagination)
    /*
        Note:
        - If the clients are not a system admin, they must have an id of their class and an id of the progress in their class.
    */
    async milestonePagination(query: MilestonePaginationDTO, req: Request | any) {
        const { classId, progressId, page, size, search, is_stopped, is_deleted } = query

        if (!page || !size) throw new BadRequestException("Invalid data")

        const client = req.userData
        if (client.role !== Role.UNIADMIN && (!classId || !progressId)) throw new BadRequestException("Invalid data")

        // If the client is not a systemadmin. Check if the user is a member
        if (client.role !== Role.UNIADMIN) {

            const isMember = await this.classMembers.findOne({
                where: {
                    user: { id: client.id },
                    class: { id: classId }
                }
            })

            if (!isMember) throw new ForbiddenException(CLASS_MEMBERSHIP_REQUIRED_403)
        }

        // Only system admin can edit is_deleted field
        const mainValidate = {
            progress: {
                id: progressId,
                class: {
                    id: classId
                }
            }
        }

        const [milestones, total] = await this.milestones.findAndCount({
            select: {
                progress: {
                    id: true,
                    label: true,
                    description: true,
                    created_at: true
                }
            },
            where: {
                ...mainValidate,
                label: search
                    ? Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:search)`, { search: `%${search}%` })
                    : undefined,

                is_stopped: typeof is_stopped === "boolean" ? is_stopped : undefined,

                is_deleted: client.role === Role.UNIADMIN ? (is_deleted ?? false) : false
            },
            relations: {
                progress: true
            },
            order: {
                index: "ASC",
                created_at: "DESC",
                progress: {
                    id: "ASC"
                }
            },
            take: Number(size),
            skip: (Number.parseInt(page) - 1) * Number(size)

        })

        return {
            data: milestones,
            pagination: {
                page: Number(page),
                size: Number(size),
                total_progress: total,
                total_page: Math.ceil(total / Number(size))
            }
        }

    }

    // Get one milestone (get detail) (all user)
    async getMilestone(query: { milestoneId: string, classId: string }, req: Request | any) {
        const { milestoneId, classId } = query

        if (!classId || !milestoneId) throw new BadRequestException("Invalid data")

        const client = req.userData

        if (client.role !== Role.UNIADMIN) {
            // Check member
            const isMember = await this.classMembers.findOne({
                where: {
                    user: client.id,
                    class: {
                        id: classId
                    }
                }
            })

            if (!isMember) throw new ForbiddenException("You don't have permission to access")
        }

        const milestone = await this.milestones.findOne({
            relations: {
                forms: true,
                scoreForms: true
            },
            where: {
                id: milestoneId,
                progress: { class: { id: classId } }
            },
        });

        if (!milestone) throw new NotFoundException("Milestone not found");

        return milestone

    }

    // Create a new milestone (Systme admin and owner's class)
    async createNewMilestone(milestones: NewMilestoneDTO, req: Request | any) { // Using save method
        const { classId, progressId, milestone: milestoneList } = milestones

        if (!classId || !progressId || milestoneList.length === 0) throw new BadRequestException("Data is invalid")

        const client = req.userData
        if (client.role !== Role.UNIADMIN) {
            const isOwner = await this.classMembers.findOne({
                where: {
                    class: { id: classId },
                    user: { id: client.id },
                    role: RoomRole.ROOMADMIN
                }
            })

            if (!isOwner) throw new ForbiddenException("Access denied")
        }

        // Get progress
        const getProgress = await this.getOneProgress({ classId }, req)

        // Phân loại milestone
        const newMilestone: Partial<Milestones>[] = []
        const updateMilestone: Partial<Milestones>[] = []

        // Validate data and order
        milestoneList.forEach((m, index) => {
            const order = index + 1
            const checkOrder = milestoneList.find(m => m.index === order.toString())
            if (!checkOrder) throw new BadRequestException("The order of a milestone is invalid")
            if (!m.label.trim()) throw new BadRequestException("Invalid data of a milestone")

            if (m.id) {
                if (!isUUID(m.id)) throw new BadRequestException("A milestone ID is invalid")

                updateMilestone.push({
                    id: m.id,
                    label: m.label,
                    index: Number(m.index),
                    description: m.description ? m.description : undefined,
                    is_stopped: typeof m.is_stopped === "boolean" ? m.is_stopped : false,
                    createdBy: client.id,
                    progress: getProgress
                })
            } else {
                newMilestone.push({
                    label: m.label,
                    index: Number(m.index),
                    description: m.description ? m.description : undefined,
                    is_stopped: typeof m.is_stopped === "boolean" ? m.is_stopped : false,
                    createdBy: client.id,
                    progress: getProgress
                })
            }
        })

        // Check existance of milestones in updateMilestone variable
        const getListOfUpdateMilestone = updateMilestone.map(m => m.id).filter(m => m !== undefined)

        let checkExistance = await this.milestones.find({
            select: {
                id: true
            },
            where: {
                id: In(getListOfUpdateMilestone),
                progress: {
                    id: progressId,
                    class: {
                        id: classId
                    }
                }
            }
        })


        const checkExistanceIdList = checkExistance.map(item => item.id)

        const checkedUpdateMilestone = updateMilestone.map(um => {
            if (um.id && checkExistanceIdList.includes(um.id)) return um
        }).filter(m => m !== undefined)

        // Save
        await this.dataSource.transaction(async (manager) => {
            await manager.save(Milestones, [...checkedUpdateMilestone, ...newMilestone], { reload: true })
        })

        // If updating data but it's not changed. Empty array
        const finalData = await this.milestones.find({
            where: {
                progress: {
                    id: progressId,
                    class: { id: classId }
                },
            },
            order: { index: 'ASC' }
        });

        return {
            updated: finalData
                .filter(m => checkExistanceIdList.includes(m.id))
                .map(({ createdBy, progress, ...m }) => m),

            added: finalData
                .filter(m => !checkExistanceIdList.includes(m.id))
                .map(({ createdBy, progress, ...m }) => m)
        };

    }

    // Update milestone
    async updateMilestones(milestones: NewMilestoneDTO, req: Request | any) {
        const { classId, progressId, milestone: milestoneList } = milestones

        if (!classId || !progressId || milestoneList.length === 0) throw new BadRequestException("Invalid data")

        const client = req.userData

        // Only system admin and owner's class can update milestones
        if (client.role !== Role.UNIADMIN) {
            const isOwner = await this.classMembers.findOne({
                where: {
                    class: { id: classId },
                    user: { id: client.id },
                    role: RoomRole.ROOMADMIN
                }
            })

            if (!isOwner) throw new ForbiddenException("Access denied or you are not the owner of this class")
        }

        // Check if all items have an id
        if (milestoneList.some(m => !m.id)) {
            throw new BadRequestException("All milestones must have an ID for update")
        }

        // Check if all essential fields are complete
        if (milestoneList.some(m => !m.label || !m.index)) {
            throw new BadRequestException("All milestones must have label and index")
        }

        // Check if indices (1 to N) are present and valid
        const n = milestoneList.length
        const indices = milestoneList.map(m => Number(m.index)).sort((a, b) => a - b)
        for (let i = 1; i <= n; i++) {
            if (indices[i - 1] !== i) {
                throw new BadRequestException(`The order of milestones is invalid. Must contain all numbers from 1 to ${n}`)
            }
        }

        // Verify count of active milestones to prevent index duplication
        const totalActiveMilestones = await this.milestones.count({
            where: {
                progress: { id: progressId, class: { id: classId } },
                is_deleted: false
            }
        })

        if (totalActiveMilestones !== n) {
            throw new BadRequestException(`You must provide all ${totalActiveMilestones} active milestones to update indices correctly.`)
        }

        // Verify all IDs exist in DB, are not deleted, and belong to this progress
        const ids = milestoneList.map(m => m.id)
        const dbMilestones = await this.milestones.find({
            where: {
                id: In(ids),
                is_deleted: false,
                progress: {
                    id: progressId,
                    class: { id: classId }
                }
            }
        })

        if (dbMilestones.length !== ids.length) {
            throw new NotFoundException("One or more milestones not found, are deleted, or do not belong to this progress")
        }

        // Prepare data for update
        const milestonesToUpdate = milestoneList.map(m => {
            return {
                id: m.id,
                label: m.label,
                index: Number(m.index),
                description: m.description,
            }
        })

        // Use transaction to ensure consistency
        return await this.dataSource.transaction(async (manager) => {
            const saved = await manager.save(Milestones, milestonesToUpdate)
            return {
                updated: saved
            }
        })
    }

    // Remove milestone (single or multi)
    async removeMilestones(ids: string[], req: Request | any) {
        const client = req.userData;
        const clientRole = req.role;
        const filterMilestoneIds = ids.filter(id => id.trim() !== "");

        if (filterMilestoneIds.length === 0) throw new BadRequestException("Data is invalid");

        // 1. Kiểm tra quyền sở hữu (Nếu không phải UNIADMIN)
        if (clientRole !== Role.UNIADMIN) {
            const milestonesCount = await this.milestones.count({
                where: {
                    id: In(filterMilestoneIds),
                    progress: {
                        class: {
                            members: {
                                user: { id: client.id },
                                role: RoomRole.ROOMADMIN
                            }
                        }
                    }
                }
            });

            if (milestonesCount !== filterMilestoneIds.length) {
                throw new ForbiddenException("Access denied or you don't own some of these milestones");
            }
        }

        // Xóa file outline trên Supabase Storage của các topics thuộc milestone sắp xóa
        const topicsWithFiles = await this.topics.find({
            where: { milestone: { id: In(filterMilestoneIds) } },
            select: { outline_file_url: true }
        })
        const filePaths = topicsWithFiles
            .filter(t => t.outline_file_url)
            .map(t => t.outline_file_url!.split('/Outline/')[1])
            .filter(Boolean)
        if (filePaths.length > 0) {
            const supabase = createClient(
                this.configService.get<string>('SUPABASE_URL')!,
                this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
            )
            await supabase.storage.from('Outline').remove(filePaths)
        }

        // 2. Phân loại Milestone: Xóa mềm (nếu có submission/scoreForm status 'accept') và Xóa cứng (còn lại)
        const softDeleteQuery = this.milestones.createQueryBuilder("m")
            .select("m.id")
            .where("m.id IN (:...ids)", { ids: filterMilestoneIds })
            .andWhere(new Brackets(qb => {
                // Check Submission status 'accept'
                qb.where(sub_qb => {
                    const subQuery = sub_qb.subQuery()
                        .select("1")
                        .from("submissions", "s")
                        .innerJoin("forms", "f", "f.id = s.form_id")
                        .where("f.milestone = m.id")
                        .andWhere("s.status::text = :status")
                        .getQuery();
                    return `EXISTS (${subQuery})`;
                })
                    // Check ScoreForm status 'accept'
                    .orWhere(sub_qb => {
                        const subQuery = sub_qb.subQuery()
                            .select("1")
                            .from("score_forms", "sf")
                            .where("sf.milestone = m.id")
                            .andWhere("sf.status::text = :status")
                            .getQuery();
                        return `EXISTS (${subQuery})`;
                    });
            }))
            .setParameter("status", SubmissionStatus.ACCEPT);

        const softDeleteMilestones = await softDeleteQuery.getMany();
        const softDeleteIds = softDeleteMilestones.map(m => m.id);
        const hardDeleteIds = filterMilestoneIds.filter(id => !softDeleteIds.includes(id));

        // 3. Thực hiện xóa trong Transaction
        return await this.dataSource.transaction(async (manager) => {
            if (softDeleteIds.length > 0) {
                await manager.update(Milestones, { id: In(softDeleteIds) }, { is_deleted: true });
            }

            if (hardDeleteIds.length > 0) {
                await manager.delete(Milestones, { id: In(hardDeleteIds) });
            }

            return {
                deleted_ids: filterMilestoneIds,
                soft_deleted: softDeleteIds,
                hard_deleted: hardDeleteIds
            };
        });
    }

    // Create registration milestone
    async createRegistrationMilestone(classId: string, req: Request | any) {
        const client = req.userData

        const member = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
        })
        if (!member && client.role !== Role.UNIADMIN) throw new ForbiddenException("Access denied")

        const progress = await this.progresses.findOne({
            where: { class: { id: classId } },
            relations: { milestones: true }
        })
        if (!progress) throw new NotFoundException("Progress not found")

        const alreadyExists = progress.milestones.some(m => m.is_registration_milestone)
        if (alreadyExists) throw new ConflictException("Registration milestone already exists")

        const milestone = this.milestones.create({
            index: 0,
            label: "Đăng ký đề tài",
            is_registration_milestone: true,
            progress: { id: progress.id },
            createdBy: { id: client.id }
        })
        await this.milestones.save(milestone)
        return this.getOneProgress({ classId }, req)
    }
}