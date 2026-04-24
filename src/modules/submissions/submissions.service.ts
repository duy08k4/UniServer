import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeepPartial, In, Repository } from "typeorm";
import { Forms } from "src/entities/forms.en";
import { Fields } from "src/entities/fields.en";
import { Checkbox_fields } from "src/entities/checkbox_fields.en";
import { CheckboxFieldChoices } from "src/entities/checkbox_field_choices.en";
import { Submissions } from "src/entities/submissions.en";
import { SubmissionAnswers } from "src/entities/submission_answers.en";
import { SubmissionCheckboxes } from "src/entities/submission_checkboxes.en";
import { Users } from "src/entities/user.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Topics } from "src/entities/topics.en";
import { Milestones } from "src/entities/milestones.en";
import { UpdateSubmissionDTO, SubmissionPaginationDTO } from "./submissions.dto";
import { MainRole, Role, RoomRole, TopicStatus } from "src/enums/enums";

@Injectable()
export class SubmissionService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Forms) private readonly formRepo: Repository<Forms>,
        @InjectRepository(Fields) private readonly fieldRepo: Repository<Fields>,
        @InjectRepository(Checkbox_fields) private readonly cbFieldRepo: Repository<Checkbox_fields>,
        @InjectRepository(CheckboxFieldChoices) private readonly choiceRepo: Repository<CheckboxFieldChoices>,
        @InjectRepository(Submissions) private readonly submissionRepo: Repository<Submissions>,
        @InjectRepository(ClassMembers) private readonly classMemberRepo: Repository<ClassMembers>,
        @InjectRepository(Topics) private readonly topicRepo: Repository<Topics>,
        @InjectRepository(Milestones) private readonly milestoneRepo: Repository<Milestones>,
    ) { }

    async getSubmissionsPagination(query: SubmissionPaginationDTO, req: Request | any) {
        const { classId, formId, page, size, search, status } = query
        const client = req.userData
        const pageNum = parseInt(page)
        const sizeNum = parseInt(size)

        // Role-based access validation
        if (client.role !== Role.UNIADMIN) {
            if (!classId) throw new BadRequestException('classId is required')

            if (client.role === RoomRole.ROOMADMIN) {
                const isMember = await this.classMemberRepo.findOne({
                    where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
                })
                if (!isMember) throw new ForbiddenException('Access denied')
            } else {
                const isMember = await this.classMemberRepo.findOne({
                    where: { class: { id: classId }, user: { id: client.id } }
                })
                if (!isMember) throw new ForbiddenException('Access denied')
            }
        }

        const qb = this.submissionRepo.createQueryBuilder('sub')
            .leftJoin('sub.user', 'user')
            .leftJoin('sub.form', 'form')
            .leftJoin('form.class', 'class')
            .select([
                'sub.id', 'sub.status', 'sub.created_at', 'sub.updated_at',
                'user.id', 'user.full_name', 'user.email',
                'form.id', 'form.label',
                'class.id', 'class.label'
            ])

        if (classId) qb.andWhere('class.id = :classId', { classId })
        if (formId) qb.andWhere('form.id = :formId', { formId })
        if (status) qb.andWhere('sub.status = :status', { status })

        // Non-admin users can only see their own submissions
        if (client.role !== Role.UNIADMIN && client.role !== RoomRole.ROOMADMIN) {
            qb.andWhere('user.id = :userId', { userId: client.id })
        }

        if (search) {
            qb.andWhere('user.full_name ILIKE :search OR user.email ILIKE :search', { search: `%${search}%` })
        }

        const [data, total] = await qb
            .skip((pageNum - 1) * sizeNum)
            .take(sizeNum)
            .orderBy('sub.created_at', 'DESC')
            .getManyAndCount()

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

    async deleteSubmission(id: string, req: Request | any) {
        const client = req.userData

        const sub = await this.submissionRepo.findOne({
            where: { id },
            relations: { form: true, user: true },
            select: { id: true, user: { id: true }, form: { id: true, is_deleted: true, is_stopped: true } }
        })
        if (!sub) throw new NotFoundException('Submission not found')

        const isAdminRole = client.role === Role.UNIADMIN || client.role === RoomRole.ROOMADMIN
        if (!isAdminRole && sub.user.id !== client.id) throw new ForbiddenException('Access denied')

        if (sub.form.is_stopped || sub.form.is_deleted)
            throw new BadRequestException('Cannot delete submission while form is closed or deleted')

        await this.submissionRepo.delete({ id })
        return { message: 'Submission deleted successfully' }
    }

    async getSubmissionDetail(id: string, req: Request | any) {
        const client = req.userData

        const sub = await this.submissionRepo.createQueryBuilder('sub')
            .leftJoin('sub.user', 'user')
            .leftJoin('sub.form', 'form')
            .leftJoin('sub.answers', 'answers')
            .leftJoin('sub.checkboxes', 'checkboxes')
            .leftJoin('checkboxes.checkboxField', 'checkboxField')
            .leftJoin('checkboxes.fieldChoices', 'fieldChoices')
            .select([
                'sub.id', 'sub.status', 'sub.created_at', 'sub.updated_at',
                'user.id', 'user.full_name', 'user.email',
                'form.id', 'form.label',
                'answers.id', 'answers.body', 'answers.input_type',
                'checkboxes.id',
                'checkboxField.id',
                'fieldChoices.id', 'fieldChoices.body'
            ])
            .where('sub.id = :id', { id })
            .getOne()

        if (!sub) throw new NotFoundException('Submission not found')

        if (client.role !== Role.UNIADMIN && client.role !== RoomRole.ROOMADMIN) {
            if (sub.user.id !== client.id) throw new ForbiddenException('Access denied')
        }

        return sub
    }

    async upsertSubmission(dto: UpdateSubmissionDTO, req: Request | any) {
        const userId = req.userData.id
        const now = new Date()

        // Step 1 — Validate form and class membership
        const form = await this.formRepo.findOne({
            where: { id: dto.formId },
            relations: { class: true, milestone: { progress: true } },
            select: {
                id: true,
                is_deleted: true,
                is_stopped: true,
                is_auto_open: true,
                is_auto_close: true,
                open_at: true,
                close_at: true,
                class: { id: true },
                milestone: { id: true, is_registration_milestone: true, progress: { id: true } }
            }
        })

        if (!form || form.is_deleted) throw new NotFoundException({ errorCode: 'FORM_NOT_FOUND', message: 'Form không tồn tại' })

        // Check Membership
        const isMember = await this.classMemberRepo.findOne({
            where: { class: { id: form.class.id }, user: { id: userId }, is_deleted: false, is_banned: false }
        })
        if (!isMember) throw new ForbiddenException({ errorCode: 'NOT_CLASS_MEMBER', message: 'Bạn không phải là thành viên của lớp này' })

        // Check Form Status & Time
        if (form.is_stopped) throw new BadRequestException({ errorCode: 'FORM_STOPPED', message: 'Form đã đóng' })

        if (form.is_auto_open && form.open_at && now < form.open_at) {
            throw new BadRequestException({ errorCode: 'FORM_NOT_OPENED', message: 'Form chưa đến thời gian mở' })
        }

        if (form.is_auto_close && form.close_at && now > form.close_at) {
            throw new BadRequestException({ errorCode: 'FORM_EXPIRED', message: 'Form đã hết hạn nộp' })
        }

        // Guard: Topic approval check
        if (form.milestone && !form.milestone.is_registration_milestone) {
            const registrationMilestone = await this.milestoneRepo.findOne({
                where: { progress: { id: form.milestone.progress.id }, is_registration_milestone: true }
            })
            if (registrationMilestone) {
                const approvedTopic = await this.topicRepo.findOne({
                    where: { milestone: { id: registrationMilestone.id }, student: { id: userId }, status: TopicStatus.APPROVED }
                })
                if (!approvedTopic) throw new ForbiddenException({ errorCode: 'TOPIC_NOT_APPROVED', message: 'Đề tài của bạn chưa được duyệt' })
            }
        }

        // Step 2 — Validate submission ownership/duplication
        let existingSubmission: Submissions | null = null
        if (dto.id) {
            existingSubmission = await this.submissionRepo.findOne({ where: { id: dto.id, user: { id: userId } } })
            if (!existingSubmission) throw new NotFoundException({ errorCode: 'SUBMISSION_NOT_FOUND', message: 'Bản nộp không tồn tại hoặc không thuộc về bạn' })
        } else {
            const duplicate = await this.submissionRepo.findOne({ where: { form: { id: dto.formId }, user: { id: userId } } })
            if (duplicate) throw new ConflictException({ errorCode: 'SUBMISSION_EXISTED', message: 'Bạn đã nộp form này rồi' })
        }

        // Step 3 — Batch validate fields & choices
        const fieldIds = dto.answer.map(a => a.fieldId)
        const cbFieldIds = dto.answer_checkbox.map(a => a.checkboxFieldId)
        const choiceIds = dto.answer_checkbox.map(a => a.fieldChoicesId)

        const [fields, cbFields, choices] = await Promise.all([
            fieldIds.length ? this.fieldRepo.find({ where: { id: In(fieldIds), is_deleted: false }, select: ['id'] }) : [],
            cbFieldIds.length ? this.cbFieldRepo.find({ where: { id: In(cbFieldIds), is_deleted: false }, select: ['id'] }) : [],
            choiceIds.length ? this.choiceRepo.find({ where: { id: In(choiceIds) }, select: ['id'] }) : [],
        ])

        const fieldMap = new Map(fields.map((f: Fields) => [f.id, f] as [string, Fields]))
        const cbFieldMap = new Map(cbFields.map((f: Checkbox_fields) => [f.id, f] as [string, Checkbox_fields]))
        const choiceMap = new Map(choices.map((c: CheckboxFieldChoices) => [c.id, c] as [string, CheckboxFieldChoices]))

        for (const a of dto.answer) {
            if (!fieldMap.has(a.fieldId))
                throw new NotFoundException({ errorCode: 'FIELD_NOT_FOUND', message: `Trường dữ liệu ${a.fieldId} không tồn tại` })
        }
        for (const a of dto.answer_checkbox) {
            if (!cbFieldMap.has(a.checkboxFieldId))
                throw new NotFoundException({ errorCode: 'FIELD_NOT_FOUND', message: `Trường trắc nghiệm ${a.checkboxFieldId} không tồn tại` })
            if (!choiceMap.has(a.fieldChoicesId))
                throw new NotFoundException({ errorCode: 'CHOICE_NOT_FOUND', message: `Lựa chọn ${a.fieldChoicesId} không tồn tại` })
        }

        // Step 4-7 — Transaction
        return await this.dataSource.transaction(async (manager) => {
            // Step 4 — Upsert submission
            let savedSubmission: Submissions
            if (existingSubmission) {
                // Manually updating updated_at if needed, though TypeORM's @UpdateDateColumn handles it on save
                existingSubmission.updated_at = new Date()
                savedSubmission = await manager.save(Submissions, existingSubmission)
            } else {
                savedSubmission = await manager.save(Submissions, manager.create(Submissions, {
                    form: { id: dto.formId } as DeepPartial<Forms>,
                    user: { id: userId } as DeepPartial<Users>
                }))
            }

            // Step 5 — Upsert answers
            const answersToCreate = dto.answer
                .filter(a => !a.id)
                .map(a => manager.create(SubmissionAnswers, {
                    field: { id: a.fieldId } as DeepPartial<Fields>,
                    body: a.body,
                    input_type: a.input_type,
                    submission: { id: savedSubmission.id } as DeepPartial<Submissions>
                }))

            const answersToUpdate = dto.answer.filter(a => !!a.id)

            await Promise.all([
                answersToCreate.length ? manager.save(SubmissionAnswers, answersToCreate) : Promise.resolve(),
                ...answersToUpdate.map(async a => {
                    const result = await manager.update(SubmissionAnswers, { id: a.id, submission: savedSubmission.id }, { body: a.body, input_type: a.input_type })
                    if (!result.affected) throw new NotFoundException({ errorCode: 'ANSWER_NOT_FOUND', message: `Câu trả lời ${a.id} không tồn tại` })
                })
            ])

            // Step 6 — Upsert answer_checkboxes
            const checkboxesToCreate = dto.answer_checkbox
                .filter(a => !a.id)
                .map(a => manager.create(SubmissionCheckboxes, {
                    checkboxField: { id: a.checkboxFieldId } as DeepPartial<Checkbox_fields>,
                    fieldChoices: { id: a.fieldChoicesId } as DeepPartial<CheckboxFieldChoices>,
                    submission: { id: savedSubmission.id } as DeepPartial<Submissions>
                }))

            const checkboxesToUpdate = dto.answer_checkbox.filter(a => !!a.id)

            await Promise.all([
                checkboxesToCreate.length ? manager.save(SubmissionCheckboxes, checkboxesToCreate) : Promise.resolve(),
                ...checkboxesToUpdate.map(async a => {
                    const result = await manager.update(SubmissionCheckboxes, { id: a.id, submission: savedSubmission.id }, { checkboxField: { id: a.checkboxFieldId }, fieldChoices: { id: a.fieldChoicesId } })
                    if (!result.affected) throw new NotFoundException({ errorCode: 'ANSWER_CHECKBOX_NOT_FOUND', message: `Câu trả lời trắc nghiệm ${a.id} không tồn tại` })
                })
            ])

            // Step 7 — Return detailed submission
            return manager.findOne(Submissions, {
                where: { id: savedSubmission.id },
                relations: { 
                    answers: true, 
                    checkboxes: { 
                        checkboxField: true,
                        fieldChoices: true 
                    } 
                }
            })
        })
    }
}
