import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CLASS_LIMITS } from "src/config/class-limits";
import { ScoreFormsPaginationDTO, UpdateScoreFormDTO, RemoveScoreFormsDTO } from "./scoreforms.dto";
import { ColumnAllowedRole, ColumnLabel, ColumnType, CommitteeRole, MainRole, RoomRole, ScoreForm_Type, SubmissionStatus } from "src/enums/enums";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassMembers } from "src/entities/class_members.en";
import { ScoreForms } from "src/entities/score_forms.en";
import { ScoreFormColumns } from "src/entities/score_form_columns.en";
import { ScoreFormCells } from "src/entities/score_form_cells.en";
import { ScoreFormRows } from "src/entities/score_form_rows.en";
import { Topics } from "src/entities/topics.en";
import { CommitteeMembers } from "src/entities/committee_members.en";
import { Brackets, DataSource, DeepPartial, In, Repository } from "typeorm";
import { FormulaHelper } from "./formula.helper";
import { isUUID } from "class-validator";
import { ScoreFormsGateway } from "./scoreforms.gateway";

@Injectable()
export class ScoreFormsService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly scoreFormGateway: ScoreFormsGateway,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
        @InjectRepository(ScoreForms)
        private readonly scoreFormRepo: Repository<ScoreForms>,
        @InjectRepository(ScoreFormColumns)
        private readonly scoreFormColumnRepo: Repository<ScoreFormColumns>,
        @InjectRepository(ScoreFormCells)
        private readonly scoreFormCellRepo: Repository<ScoreFormCells>,
        @InjectRepository(ScoreFormRows)
        private readonly scoreFormRowRepo: Repository<ScoreFormRows>,
        @InjectRepository(Topics)
        private readonly topicRepo: Repository<Topics>,
        @InjectRepository(CommitteeMembers)
        private readonly committeeMemberRepo: Repository<CommitteeMembers>,
    ) { }

    // Tách full_name thành họ lót và tên
    private splitName(fullName: string) {
        const parts = fullName.trim().split(' ')
        const firstName = parts.at(-1) ?? ''
        const lastName = parts.slice(0, -1).join(' ')
        return { firstName, lastName }
    }

    // Tạo rows còn thiếu cho các SV đã được duyệt vào lớp
    async syncMissingRows(scoreFormId: string, classId: string) {
        const scoreForm = await this.scoreFormRepo.findOne({ where: { id: scoreFormId } })
        if (!scoreForm) return

        const nameCols = await this.scoreFormColumnRepo.find({
            where: { scoreForm: { id: scoreFormId }, column_label: In([ColumnLabel.LAST_NAME, ColumnLabel.FIRST_NAME]) }
        })
        const lastNameCol = nameCols.find(c => c.column_label === ColumnLabel.LAST_NAME)
        const firstNameCol = nameCols.find(c => c.column_label === ColumnLabel.FIRST_NAME)

        const students = await this.classMemberRepo.find({
            where: { class: { id: classId }, role: RoomRole.STUDENT, roomadmin_approved: true },
            relations: { user: true }
        })

        const existingRows = await this.scoreFormRowRepo.find({
            where: { scoreForm: { id: scoreFormId } },
            relations: { student: true }
        })
        const existingStudentIds = new Set(existingRows.map(r => r.student.id))

        const missingStudents = students.filter(m => !existingStudentIds.has(m.user.id))
        if (!missingStudents.length) return

        const nextIndex = existingRows.length

        for (let i = 0; i < missingStudents.length; i++) {
            const user = missingStudents[i].user
            const { firstName, lastName } = this.splitName(user.full_name)

            const row = await this.scoreFormRowRepo.save({
                index: nextIndex + i,
                student: { id: user.id },
                scoreForm: { id: scoreFormId }
            })

            const cells: any[] = []
            if (lastNameCol) cells.push({ value: lastName, row: { id: row.id }, column: { id: lastNameCol.id }, score_form: { id: scoreFormId } })
            if (firstNameCol) cells.push({ value: firstName, row: { id: row.id }, column: { id: firstNameCol.id }, score_form: { id: scoreFormId } })
            if (cells.length) await this.scoreFormCellRepo.insert(cells)
        }
    }

    // Get score-form (pagination)
    async scoreFormsPagination(query: ScoreFormsPaginationDTO, req: Request | any) {
        const { classId, page, size, search, scoreform_type, is_deleted, is_stopped } = query
        const client = req.userData

        let member: ClassMembers | null = null
        if (client.role !== MainRole.UNIADMIN) {
            if (!classId) throw new BadRequestException("Class ID is required")
            member = await this.classMemberRepo.findOne({
                where: { class: { id: classId }, user: { id: client.id } }
            })
            if (!member) throw new ForbiddenException("Access denied")
        }

        const pageNum = parseInt(page as any) || 1
        const sizeNum = parseInt(size as any) || 10

        const qb = this.scoreFormRepo.createQueryBuilder('sf')
            .leftJoin('sf.class', 'class')
            .leftJoin('sf.createdBy', 'createdBy')
            .leftJoin('sf.milestone', 'milestone')
            .leftJoin('milestone.progress', 'progress')
            .select([
                'sf',
                'class.id', 'class.label',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email'
            ])
            .skip((pageNum - 1) * sizeNum)
            .take(sizeNum)
            .orderBy('sf.created_at', 'DESC')

        if (is_deleted !== undefined) {
            qb.andWhere('sf.is_deleted = :is_deleted', { is_deleted })
        } else if (client.role !== MainRole.UNIADMIN) {
            qb.andWhere('sf.is_deleted = false')
        }

        if (scoreform_type) qb.andWhere('sf.score_form_type = :scoreform_type', { scoreform_type })
        if (classId) qb.andWhere('class.id = :classId', { classId })
        if (search) qb.andWhere('(sf.label ILIKE :search OR class.label ILIKE :search)', { search: `%${search}%` })
        if (is_stopped !== undefined) qb.andWhere('sf.is_stopped = :is_stopped', { is_stopped })

        // Guard: For Students/Lecturers, only show score forms if progress is approved
        if (client.role !== MainRole.UNIADMIN && member?.role !== RoomRole.ROOMADMIN) {
            qb.andWhere(new Brackets(filter_qb => {
                filter_qb.where('progress.created_approval = true')
                    .orWhere('sf.milestone IS NULL')
            }))
        }

        const [data, total] = await qb.getManyAndCount()

        return {
            data,
            pagination: { total, page: pageNum, size: sizeNum, totalPages: Math.ceil(total / sizeNum) }
        }
    }

    // Get one score-form (detail)
    async getScoreFormDetail(id: string, req: Request | any) {
        const scoreForm = await this.scoreFormRepo.createQueryBuilder('sf')
            .leftJoin('sf.class', 'class')
            .leftJoin('sf.createdBy', 'createdBy')
            .leftJoin('sf.milestone', 'milestone')
            .leftJoin('milestone.progress', 'progress')
            .leftJoinAndSelect('sf.columns', 'columns')
            .select([
                'sf',
                'class.id', 'class.join_code', 'class.label',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email',
                'milestone.id', 'milestone.label',
                'progress.id', 'progress.created_approval',
                'columns',
            ])
            .where('sf.id = :id', { id })
            .getOne()

        if (!scoreForm) throw new NotFoundException("Score form not found")

        const client = req.userData
        if (client.role !== MainRole.UNIADMIN) {
            const member = await this.classMemberRepo.findOne({
                where: { class: { id: scoreForm.class.id }, user: { id: client.id } }
            })
            if (!member) throw new ForbiddenException("Access denied")

            // Guard: Only RoomAdmin and UniAdmin can see score forms of unapproved progress
            if (member.role !== RoomRole.ROOMADMIN && scoreForm.milestone?.progress && !scoreForm.milestone.progress.created_approval) {
                throw new ForbiddenException("Quy trình của lớp học này chưa được phê duyệt")
            }
        }

        return scoreForm
    }

    // Update score-form
    async updateScoreForm(body: UpdateScoreFormDTO, req: Request | any) {
        const { classId, id, score_form_type, label, description, field_count, is_auto_open, is_auto_close, is_deleted, is_stopped, open_at, close_at, columns } = body
        if (!classId) throw new BadRequestException("Class ID is required")

        const client = req.userData
        if (client.role !== MainRole.UNIADMIN) {
            const isRoomadmin = await this.classMemberRepo.findOne({
                where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
            })
            if (!isRoomadmin) throw new ForbiddenException("Only UniAdmin or RoomAdmin can create and update score form")
        }

        let updatedForm: ScoreForms | null = null;
        let oldStoppedState: boolean | undefined;

        if (id) {
            const scoreForm = await this.scoreFormRepo.findOne({ where: { id, class: { id: classId } } })
            if (!scoreForm) throw new NotFoundException("Score form not found")
            oldStoppedState = scoreForm.is_stopped;

            updatedForm = await this.dataSource.transaction(async (manager) => {
                Object.assign(scoreForm, { score_form_type, label, description, field_count: parseInt(field_count), is_auto_open, is_auto_close, is_deleted, is_stopped, open_at: is_auto_open ? open_at : null, close_at: is_auto_close ? close_at : null })

                const existingCols = await manager.find(ScoreFormColumns, { where: { scoreForm: { id } }, select: ['id', 'label', 'formula_content', 'column_label'] })
                const existingColIds = existingCols.map(c => c.id)
                const incomingIds = columns.filter(c => c.id).map(c => c.id) as string[]
                const toDelete = existingColIds.filter(cid => !incomingIds.includes(cid) && !existingCols.find(c => c.id === cid)?.column_label)

                for (const colId of toDelete) {
                    const { isReferenced, referencedBy } = FormulaHelper.isColumnReferenced(colId, existingCols)
                    if (isReferenced) throw new BadRequestException(`Không thể xóa cột vì đang dùng trong: ${referencedBy.join(', ')}`)
                }
                if (toDelete.length) await manager.delete(ScoreFormColumns, { id: In(toDelete) })

                for (const col of columns) {
                    if (col.formula_content) {
                        const colsForVal = existingCols.filter(c => !toDelete.includes(c.id)).map(c => {
                            const inc = columns.find(ic => ic.id === c.id)
                            return inc ? { ...c, formula_content: inc.formula_content || null } : c
                        })
                        FormulaHelper.detectCircularDependency(col.id || 'new-column', col.formula_content, colsForVal)
                    }
                }

                const newCols = columns.filter(c => !c.id)
                const updatedCols = columns.filter(c => c.id)

                if (newCols.length) await manager.insert(ScoreFormColumns, newCols.map((col, i) => ({ label: col.label, formula_content: col.formula_content ?? null, allowed_role: col.allowed_role ?? null, column_type: col.column_type ?? ColumnType.NORMAL, index: col.index ? parseInt(col.index) : i, scoreForm: { id } })))
                if (updatedCols.length) await Promise.all(updatedCols.map((col, i) => manager.update(ScoreFormColumns, col.id, { label: col.label, formula_content: col.formula_content ?? null, allowed_role: col.allowed_role ?? null, column_type: col.column_type ?? ColumnType.NORMAL, index: col.index ? parseInt(col.index) : i })))

                await manager.save(ScoreForms, scoreForm)
                return manager.findOne(ScoreForms, { where: { id }, relations: ['columns'] })
            })
        } else {
            const scoreFormsCount = await this.scoreFormRepo.count({ where: { class: { id: classId }, is_deleted: false } })
            if (scoreFormsCount >= CLASS_LIMITS.MAX_SCORE_FORMS) throw new BadRequestException(`Lớp học đã đạt giới hạn bảng điểm (${CLASS_LIMITS.MAX_SCORE_FORMS})`)

            updatedForm = await this.dataSource.transaction(async (manager) => {
                const scoreForm = manager.create(ScoreForms, { score_form_type, label, description, field_count: parseInt(field_count), is_auto_open, is_auto_close, is_deleted, is_stopped, open_at: is_auto_open ? open_at : null, close_at: is_auto_close ? close_at : null, class: { id: classId }, createdBy: { id: client.id } } as DeepPartial<ScoreForms>)
                const saved = await manager.save(ScoreForms, scoreForm)

                for (const col of columns) {
                    if (col.formula_content) {
                        FormulaHelper.detectCircularDependency('new-column', col.formula_content, columns.filter(c => c !== col).map(c => ({ id: c.id || 'temp', label: c.label, formula_content: c.formula_content || null })))
                    }
                }

                const insertedCols = await manager.insert(ScoreFormColumns, [
                    { label: 'Họ lót', index: 0, column_label: ColumnLabel.LAST_NAME, column_type: ColumnType.NORMAL, scoreForm: { id: saved.id } },
                    { label: 'Tên', index: 1, column_label: ColumnLabel.FIRST_NAME, column_type: ColumnType.NORMAL, scoreForm: { id: saved.id } },
                ])
                const lastNameColId = insertedCols.identifiers[0].id
                const firstNameColId = insertedCols.identifiers[1].id

                if (columns.length) await manager.insert(ScoreFormColumns, columns.map((col, i) => ({ label: col.label, formula_content: col.formula_content ?? null, allowed_role: col.allowed_role ?? null, column_type: col.column_type ?? ColumnType.NORMAL, index: i + 2, scoreForm: { id: saved.id } })))

                const students = await manager.find(ClassMembers, { where: { class: { id: classId }, role: RoomRole.STUDENT, roomadmin_approved: true }, relations: { user: true } })
                for (let i = 0; i < students.length; i++) {
                    const user = students[i].user
                    const { firstName, lastName } = this.splitName(user.full_name)
                    const row = await manager.save(ScoreFormRows, { index: i, student: { id: user.id }, scoreForm: { id: saved.id } })
                    await manager.insert(ScoreFormCells, [
                        { value: lastName, row: { id: row.id }, column: { id: lastNameColId }, score_form: { id: saved.id } },
                        { value: firstName, row: { id: row.id }, column: { id: firstNameColId }, score_form: { id: saved.id } },
                    ])
                }
                return saved
            })
        }

        if (id && oldStoppedState !== is_stopped) {
            this.scoreFormGateway.toggleStop(id, is_stopped);
        }
        this.scoreFormGateway.scoreFormSaved(updatedForm!.id);
        return updatedForm;
    }

    async toggleStop(body: { id: string; classId: string }, req: Request | any) {
        const { id, classId } = body
        const client = req.userData
        if (client.role !== MainRole.UNIADMIN) {
            const isRoomadmin = await this.classMemberRepo.findOne({
                where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
            })
            if (!isRoomadmin) throw new ForbiddenException("Only UniAdmin or RoomAdmin can toggle stop")
        }
        const sf = await this.scoreFormRepo.findOne({ where: { id, class: { id: classId } } })
        if (!sf) throw new NotFoundException("Score form not found")
        if (sf.status === SubmissionStatus.ACCEPT) throw new BadRequestException("Cannot reopen an approved score form")
        sf.is_stopped = !sf.is_stopped
        sf.status = sf.is_stopped ? SubmissionStatus.RECEIVE : SubmissionStatus.PENDING
        await this.scoreFormRepo.save(sf)
        this.scoreFormGateway.toggleStop(id, sf.is_stopped)
        return { is_stopped: sf.is_stopped }
    }

    async approveScoreForm(body: { id: string; classId: string }, req: Request | any) {
        const client = req.userData
        if (client.role !== MainRole.UNIADMIN) throw new ForbiddenException("Only UniAdmin can approve score forms")
        const sf = await this.scoreFormRepo.findOne({
            where: { id: body.id, class: { id: body.classId } },
            relations: { createdBy: true, class: true, milestone: true, columns: true }
        })
        if (!sf) throw new NotFoundException("Score form not found")
        if (!sf.is_stopped) throw new BadRequestException("Score form must be stopped before approving")
        if (sf.status === SubmissionStatus.ACCEPT) throw new BadRequestException("Score form already approved")
        sf.status = SubmissionStatus.ACCEPT
        await this.scoreFormRepo.save(sf)
        this.scoreFormGateway.scoreFormApproved(sf.id)
        return sf
    }

    private async authorizeRemove(ids: string[], client: any) {
        const scoreForms = await this.scoreFormRepo.find({ where: { id: In(ids) }, relations: ['class'] })
        if (scoreForms.length !== ids.length) throw new NotFoundException("One or more score forms not found")
        if (client.role !== MainRole.UNIADMIN) {
            const classIds = [...new Set(scoreForms.map(sf => sf.class.id))]
            for (const classId of classIds) {
                const isRoomadmin = await this.classMemberRepo.findOne({ where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN } })
                if (!isRoomadmin) throw new ForbiddenException("Access denied")
            }
        }
        return scoreForms
    }

    async softDeleteScoreForms(body: RemoveScoreFormsDTO, req: Request | any) {
        await this.authorizeRemove(body.ids, req.userData)
        await this.scoreFormRepo.update({ id: In(body.ids) }, { is_deleted: true })
        this.scoreFormGateway.scoreFormDeleted(body.ids);
        return { message: "Soft deleted successfully" }
    }

    async hardDeleteScoreForms(body: RemoveScoreFormsDTO, req: Request | any) {
        await this.authorizeRemove(body.ids, req.userData)
        await this.scoreFormRepo.delete({ id: In(body.ids) })
        this.scoreFormGateway.scoreFormDeleted(body.ids);
        return { message: "Deleted successfully" }
    }

    async getScoreFormRows(scoreFormId: string, req: Request | any) {
        if (!isUUID(scoreFormId)) throw new BadRequestException("Invalid scoreFormId")
        const scoreForm = await this.scoreFormRepo.findOne({ where: { id: scoreFormId }, relations: { class: true } })
        if (!scoreForm) throw new NotFoundException("Score form not found")

        const client = req.userData
        let memberRole = RoomRole.STUDENT

        if (client.role !== MainRole.UNIADMIN) {
            const member = await this.classMemberRepo.findOne({ where: { class: { id: scoreForm.class.id }, user: { id: client.id } } })
            if (!member) throw new ForbiddenException("Access denied")
            memberRole = member.role as RoomRole
        } else {
            memberRole = RoomRole.ROOMADMIN
        }

        if (memberRole !== RoomRole.STUDENT) await this.syncMissingRows(scoreFormId, scoreForm.class.id)

        const where: any = { scoreForm: { id: scoreFormId } }
        if (memberRole === RoomRole.STUDENT) where.student = { id: client.id }

        return this.scoreFormRowRepo.find({
            where,
            relations: { student: true, cells: { column: true, updatedBy: true } },
            select: {
                id: true, index: true, updated_at: true,
                student: { id: true, full_name: true, email: true },
                cells: { id: true, value: true, updated_at: true, column: { id: true }, updatedBy: { id: true, full_name: true } }
            },
            order: { index: 'ASC' }
        })
    }

    async updateCell(scoreFormId: string, rowId: string, columnId: string, value: number, req: Request | any) {
        if (!isUUID(scoreFormId) || !isUUID(rowId) || !isUUID(columnId)) throw new BadRequestException("Invalid data")
        const client = req.userData
        
        return await this.dataSource.transaction(async (manager) => {
            const column = await manager.findOne(ScoreFormColumns, { where: { id: columnId, scoreForm: { id: scoreFormId } }, relations: { scoreForm: { class: true } } })
            if (!column) throw new NotFoundException("Column not found")
            if (column.formula_content) throw new ForbiddenException("Cannot manually update column with formula")
            
            const sf = column.scoreForm;
            const now = new Date();
            if (sf.is_stopped) throw new ForbiddenException("Score form is closed");
            if (sf.is_auto_open && sf.open_at && sf.open_at > now) throw new ForbiddenException("Score form has not opened yet");
            if (sf.is_auto_close && sf.close_at && sf.close_at < now) throw new ForbiddenException("Score form has already closed");

            await this.checkCellPermission(column, client, sf.class.id, rowId)

            let cell = await manager.findOne(ScoreFormCells, { where: { row: { id: rowId }, column: { id: columnId } } })
            if (cell) {
                cell.value = value.toString()
                cell.updatedBy = { id: client.id } as any
                await manager.save(cell)
            } else {
                cell = manager.create(ScoreFormCells, { value: value.toString(), row: { id: rowId }, column: { id: columnId }, updatedBy: { id: client.id } })
                await manager.save(cell)
            }
            this.scoreFormGateway.cellUpdated(scoreFormId, cell);
            return { message: "Cell updated successfully" }
        })
    }

    private async checkCellPermission(column: ScoreFormColumns, client: any, classId: string, rowId: string) {
        const { allowed_role, scoreForm } = column
        const classMember = await this.classMemberRepo.findOne({ where: { class: { id: classId }, user: { id: client.id } } })
        if (!classMember) throw new ForbiddenException("You are not in this class")
        if (classMember.role === RoomRole.STUDENT) throw new ForbiddenException("Students cannot edit scores")

        if (!allowed_role || allowed_role === ColumnAllowedRole.LECTURER) {
            if (classMember.role === RoomRole.LECTURER || classMember.role === RoomRole.ROOMADMIN) return
        }

        if (allowed_role === ColumnAllowedRole.ROOMADMIN) {
            if (classMember.role === RoomRole.ROOMADMIN) return
            throw new ForbiddenException("Only ROOMADMIN can edit this column")
        }

        if (allowed_role === ColumnAllowedRole.REVIEWER) {
            // Trường hợp 1: Phân công qua Hội đồng (Committee)
            const committeeMember = await this.committeeMemberRepo.findOne({
                where: { committee: { class: { id: classId } }, user: { id: client.id }, role: CommitteeRole.REVIEWER as any }
            })
            if (committeeMember) return

            // Trường hợp 2: Phân công trực tiếp qua Đề tài (thường dùng cho TLTN)
            const row = await this.scoreFormRowRepo.findOne({ where: { id: rowId }, relations: { student: true } })
            if (!row) throw new NotFoundException("Row not found")
            const topic = await this.topicRepo.findOne({
                where: { student: { id: row.student.id }, milestone: { progress: { class: { id: classId } } } },
                relations: { reviewer: true }
            })
            if (topic?.reviewer?.id === client.id) return

            throw new ForbiddenException("Only assigned reviewer can edit this column")
        }

        if (allowed_role && [ColumnAllowedRole.CHAIRMAN, ColumnAllowedRole.MEMBER].includes(allowed_role)) {
            const committeeMember = await this.committeeMemberRepo.findOne({
                where: { committee: { class: { id: classId } }, user: { id: client.id }, role: allowed_role as any }
            })
            if (!committeeMember) throw new ForbiddenException(`Only ${allowed_role} can edit this column`)
            return
        }

        if (scoreForm.score_form_type === ScoreForm_Type.SUPERVISOR_SCORE) {
            const row = await this.scoreFormRowRepo.findOne({ where: { id: rowId }, relations: { student: true } })
            if (!row) throw new NotFoundException("Row not found")
            const topic = await this.topicRepo.findOne({ where: { student: { id: row.student.id }, milestone: { progress: { class: { id: classId } } } }, relations: { supervisor: true } })
            if (!topic || topic.supervisor?.id !== client.id) throw new ForbiddenException("Only supervisor can edit this student's score")
        }
    }

}

