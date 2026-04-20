import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ScoreFormsPaginationDTO, UpdateScoreFormDTO, RemoveScoreFormsDTO } from "./scoreforms.dto";
import { MainRole, RoomRole } from "src/enums/enums";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassMembers } from "src/entities/class_members.en";
import { ScoreForms } from "src/entities/score_forms.en";
import { ScoreFormColumns } from "src/entities/score_form_columns.en";
import { DataSource, In, Repository } from "typeorm";

@Injectable()
export class ScoreFormsService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
        @InjectRepository(ScoreForms)
        private readonly scoreFormRepo: Repository<ScoreForms>,
    ) { }

    // Get score-form (pagination)
    async scoreFormsPagination(query: ScoreFormsPaginationDTO, req: Request | any) {
        const { classId, page, size, search, is_deleted, is_stopped } = query

        if (!page || !size) throw new BadRequestException("Invalid data")

        const client = req.userData

        if (client.role !== MainRole.UNIADMIN) {
            if (!classId) throw new BadRequestException("Class ID is required")

            const isRoomadmin = await this.classMemberRepo.findOne({
                where: {
                    class: { id: classId },
                    user: { id: client.id },
                    role: RoomRole.ROOMADMIN
                }
            })
            if (!isRoomadmin) throw new ForbiddenException("Access denied")
        }

        const pageNum = parseInt(page)
        const sizeNum = parseInt(size)

        const qb = this.scoreFormRepo.createQueryBuilder('sf')
            .leftJoin('sf.class', 'class')
            .leftJoin('sf.createdBy', 'createdBy')
            .select([
                'sf',
                'class.id', 'class.label',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email'
            ])
            .skip((pageNum - 1) * sizeNum)
            .take(sizeNum)
            .orderBy('sf.created_at', 'DESC')

        if (classId) qb.andWhere('class.id = :classId', { classId })
        if (search) qb.andWhere('(sf.label ILIKE :search OR class.label ILIKE :search)', { search: `%${search}%` })
        if (is_deleted !== undefined) qb.andWhere('sf.is_deleted = :is_deleted', { is_deleted })
        if (is_stopped !== undefined) qb.andWhere('sf.is_stopped = :is_stopped', { is_stopped })

        const [data, total] = await qb.getManyAndCount()

        return {
            data,
            pagination: {
                total,
                page: pageNum,
                size: sizeNum,
                totalPages: Math.ceil(total / sizeNum)
            }
        }
    }

    // Get one score-form (detail)
    async getScoreFormDetail(id: string, req: Request | any) {
        const scoreForm = await this.scoreFormRepo.createQueryBuilder('sf')
            .leftJoin('sf.class', 'class')
            .leftJoin('sf.createdBy', 'createdBy')
            .leftJoin('sf.milestone', 'milestone')
            .leftJoinAndSelect('sf.columns', 'columns')
            .select([
                'sf',
                'class.id', 'class.join_code', 'class.label',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email',
                'milestone.id', 'milestone.label',
                'columns',
            ])
            .where('sf.id = :id', { id })
            .getOne()

        if (!scoreForm) throw new NotFoundException("Score form not found")

        const client = req.userData
        if (client.role !== MainRole.UNIADMIN) {
            const isRoomadmin = await this.classMemberRepo.findOne({
                where: {
                    class: { id: scoreForm.class.id },
                    user: { id: client.id },
                    role: RoomRole.ROOMADMIN
                }
            })
            if (!isRoomadmin) throw new ForbiddenException("Access denied")
        }

        return scoreForm
    }

    // Update score-form (create new and update)
    async updateScoreForm(body: UpdateScoreFormDTO, req: Request | any) {
        const {
            classId,
            id,
            score_form_type,
            label,
            description,
            field_count,
            is_auto_open,
            is_auto_close,
            is_deleted,
            is_stopped,
            open_at,
            close_at,
            columns
        } = body

        if (!classId) throw new BadRequestException("Class ID is required")

        // --- Authorization --- (Only admin user can create and update score form)
        const client = req.userData

        if (client.role !== MainRole.UNIADMIN) {
            const isRoomadmin = await this.classMemberRepo.findOne({
                where: {
                    class: { id: classId },
                    user: { id: client.id },
                    role: RoomRole.ROOMADMIN
                }
            })

            if (!isRoomadmin) throw new ForbiddenException("Only UniAdmin or RoomAdmin can create and update score form")
        }

        // --- Update ---
        if (id) {
            const scoreForm = await this.scoreFormRepo.findOne({
                where: { id, class: { id: classId } }
            })
            if (!scoreForm) throw new NotFoundException("Score form not found")

            return await this.dataSource.transaction(async (manager) => {
                Object.assign(scoreForm, {
                    score_form_type, label, description,
                    field_count: parseInt(field_count),
                    is_auto_open, is_auto_close, is_deleted, is_stopped,
                    open_at, close_at
                })

                // Query chỉ lấy id để tính toDelete
                const existingColIds = (await manager.find(ScoreFormColumns, {
                    where: { scoreForm: { id } },
                    select: ['id']
                })).map(c => c.id)

                const incomingIds = columns.filter(c => c.id).map(c => c.id) as string[]
                const toDelete = existingColIds.filter(cid => !incomingIds.includes(cid))
                if (toDelete.length) await manager.delete(ScoreFormColumns, { id: In(toDelete) })

                const newCols = columns.filter(c => !c.id)
                const updatedCols = columns.filter(c => c.id)

                if (newCols.length) await manager.insert(ScoreFormColumns, newCols.map((col, i) => ({
                    label: col.label,
                    formula_content: col.formula_content ?? null,
                    index: col.index ? parseInt(col.index) : i,
                    scoreForm: { id },
                })))

                if (updatedCols.length) await Promise.all(
                    updatedCols.map((col, i) => manager.update(ScoreFormColumns, col.id, {
                        label: col.label,
                        formula_content: col.formula_content ?? null,
                        index: col.index ? parseInt(col.index) : i,
                    }))
                )

                await manager.save(ScoreForms, scoreForm)
                return manager.findOne(ScoreForms, { where: { id }, relations: ['columns'] })
            })
        }

        // --- Create ---
        return await this.dataSource.transaction(async (manager) => {
            const scoreForm = manager.create(ScoreForms, {
                score_form_type, label, description,
                field_count: parseInt(field_count),
                is_auto_open, is_auto_close, is_deleted, is_stopped,
                open_at, close_at,
                class: { id: classId },
                createdBy: { id: client.id },
            })
            const saved = await manager.save(ScoreForms, scoreForm)

            if (columns.length) await manager.insert(ScoreFormColumns, columns.map((col, i) => ({
                label: col.label,
                formula_content: col.formula_content ?? null,
                index: col.index ? parseInt(col.index) : i,
                scoreForm: { id: saved.id },
            })))

            return saved
        })
    }

    // Remove score-form (single or multi)
    private async authorizeRemove(ids: string[], client: any) {
        const scoreForms = await this.scoreFormRepo.find({
            where: { id: In(ids) },
            relations: ['class']
        })

        if (scoreForms.length !== ids.length) throw new NotFoundException("One or more score forms not found")

        if (client.role !== MainRole.UNIADMIN) {
            const classIds = [...new Set(scoreForms.map(sf => sf.class.id))]
            for (const classId of classIds) {
                const isRoomadmin = await this.classMemberRepo.findOne({
                    where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
                })
                if (!isRoomadmin) throw new ForbiddenException("Access denied")
            }
        }

        return scoreForms
    }

    async softDeleteScoreForms(body: RemoveScoreFormsDTO, req: Request | any) {
        const { ids } = body
        await this.authorizeRemove(ids, req.userData)
        await this.scoreFormRepo.update({ id: In(ids) }, { is_deleted: true })
        return { message: "Soft deleted successfully" }
    }

    async hardDeleteScoreForms(body: RemoveScoreFormsDTO, req: Request | any) {
        const { ids } = body
        await this.authorizeRemove(ids, req.userData)
        await this.scoreFormRepo.delete({ id: In(ids) })
        return { message: "Deleted successfully" }
    }

    // Remove column and row

}