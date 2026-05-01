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
import { UpdateSubmissionDTO, SubmissionPaginationDTO, GetSubmissionDetailDto } from "./submissions.dto";
import { Field_Type, MainRole, Role, RoomRole, TopicStatus } from "src/enums/enums";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SubmissionService {
    constructor(
        private readonly configService: ConfigService,
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

    // Upload file
    async uploadFile(file: any, oldUrl: string, req: Request | any) {
        const client = req.userData
        const supabase = createClient(
            this.configService.get<string>('SUPABASE_URL')!,
            this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Xóa file cũ nếu FE truyền oldUrl lên
        if (oldUrl) {
            const oldPath = oldUrl.split('/Report/')[1]
            if (oldPath) await supabase.storage.from('Report').remove([oldPath])
        }

        const ext = file.originalname.split('.').pop()
        const path = `reports/${client.id}_${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('Report').upload(path, file.buffer, { contentType: file.mimetype, upsert: true })

        if (error) throw new BadRequestException(error.message)

        const { data } = supabase.storage.from('Report').getPublicUrl(path)

        return { url: data.publicUrl }
    }

    // Remove file
    async removeFiles(urls: string[]) {
        if (!urls || urls.length === 0) return;

        const supabase = createClient(
            this.configService.get<string>('SUPABASE_URL')!,
            this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const paths = urls
            .map(url => url.split('/Report/')[1])
            .filter(path => !!path);

        if (paths.length > 0) {
            const { data, error } = await supabase
                .storage
                .from('Report')
                .remove(paths);

            if (error) {
                console.error('Error (Remove file - Supabase storage):', error);
                throw error;
            }

            return data;
        }
    }

    // Get submission (pagination)
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
        if (client.role !== Role.UNIADMIN) {
            const isRoomAdmin = await this.classMemberRepo.findOne({
                where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
            })
            if (!isRoomAdmin) {
                qb.andWhere('user.id = :userId', { userId: client.id })
            }
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

    // Delete submission
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

    // Get one submission (detail)
    /*
        Khi lấy submission loại bỏ các câu trả lời nào thuộc field có is_deleted là true

        Vì khi thay đổi form mà roomadmin xóa bỏ 1 field nào đó, nếu có 1 submission có trạng thái là accept thì field đó sẽ bị xóa mềm.
        Khi lấy form xuống thì không lấy các field đã bị xóa, nên khi lấy submission xuống cũng không lấy câu trả lời thuộc field cỏa is_deleted là true => Tránh sửa nhầm
    */
    async getSubmissionDetail(query: GetSubmissionDetailDto, req: Request | any) {
        const { userId, classId, formId } = query
        const client = req.userData

        const sub = await this.submissionRepo.createQueryBuilder('sub')
            .leftJoin('sub.user', 'user')
            .leftJoin('sub.form', 'form')
            .leftJoin('sub.answers', 'answers')
            .leftJoin('answers.field', 'field')
            .leftJoin('sub.checkboxes', 'checkboxes')
            .leftJoin('checkboxes.checkboxField', 'checkboxField')
            .leftJoin('checkboxes.fieldChoices', 'fieldChoices')
            .select([
                'sub.id', 'sub.status', 'sub.created_at', 'sub.updated_at',
                'user.id', 'user.full_name', 'user.email',
                'form.id', 'form.label',
                'answers.id', 'answers.body', 'answers.input_type', 'answers.file_name', 'answers.field',
                'field.id', 'field.title',
                'checkboxes.id',
                'checkboxField.id', 'checkboxField.title',
                'fieldChoices.id', 'fieldChoices.body'
            ])
            .where('form.id = :formId', { formId: formId })
            .andWhere('user.id = :userId', { userId: userId })
            .getOne()

        if (!sub) throw new NotFoundException('Submission not found')

        const isRoomadmin = await this.classMemberRepo.findOne({
            where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
        })

        if (client.role !== Role.UNIADMIN) {
            if (!isRoomadmin) {
                if (sub.user.id !== client.id) throw new ForbiddenException('Access denied')

                const isMember = await this.classMemberRepo.findOne({
                    where: { class: { id: classId }, user: { id: client.id } }
                })

                if (!isMember) {
                    const isJoinForm = await this.formRepo.findOne({
                        where: { id: formId, class: { id: classId }, is_join_form: true }
                    })
                    if (!isJoinForm) throw new ForbiddenException('Access denied')
                }

            } else {
                if(isRoomadmin.class.id !== classId) throw new ForbiddenException('Access denied')
            }
        }

        return sub
    }

    // Update submission
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
                is_join_form: true,
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
        if (!isMember && !form.is_join_form) throw new ForbiddenException({ errorCode: 'NOT_CLASS_MEMBER', message: 'Bạn không phải là thành viên của lớp này' })

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

        // Step 3 — Fetch all fields of the form and Validate required/ownership
        const [fields, cbFields] = await Promise.all([
            this.fieldRepo.find({ where: { form: { id: dto.formId }, is_deleted: false } }),
            this.cbFieldRepo.find({ where: { form: { id: dto.formId }, is_deleted: false }, relations: { checkbox_field_choices: true } }),
        ])

        const fieldMap = new Map(fields.map(f => [f.id, f]))
        const cbFieldMap = new Map(cbFields.map(f => [f.id, f]))

        // Check if all provided fields belong to this form
        for (const a of dto.answer) {
            if (!fieldMap.has(a.fieldId)) throw new NotFoundException({ errorCode: 'FIELD_NOT_FOUND', message: `Trường dữ liệu ${a.fieldId} không thuộc form này hoặc không tồn tại` })
        }
        for (const a of dto.answer_checkbox) {
            if (!cbFieldMap.has(a.checkboxFieldId)) throw new NotFoundException({ errorCode: 'FIELD_NOT_FOUND', message: `Trường trắc nghiệm ${a.checkboxFieldId} không thuộc form này hoặc không tồn tại` })

            const cbField = cbFieldMap.get(a.checkboxFieldId)
            const choiceExists = cbField?.checkbox_field_choices.some(c => c.id === a.fieldChoicesId)
            if (!choiceExists) throw new NotFoundException({ errorCode: 'CHOICE_NOT_FOUND', message: `Lựa chọn ${a.fieldChoicesId} không thuộc trường trắc nghiệm này` })
        }

        // Check required fields
        for (const f of fields) {
            if (f.is_required && f.is_deleted === false) {
                const answer = dto.answer.find(a => a.fieldId === f.id)
                if (!answer) throw new BadRequestException({ errorCode: 'FIELD_REQUIRED', message: `Trường '${f.title}' là bắt buộc` })

                if (f.input_type === Field_Type.FILE) {
                    if (!answer.file_name) throw new BadRequestException({ errorCode: 'FILE_REQUIRED', message: `Vui lòng tải lên file cho trường '${f.title}'` })
                } else {
                    if (!answer.body || answer.body.trim() === '') throw new BadRequestException({ errorCode: 'BODY_REQUIRED', message: `Vui lòng nhập nội dung cho trường '${f.title}'` })
                }
            }
        }

        for (const cf of cbFields) {
            if (cf.is_required && cf.is_deleted === false) {
                const hasChoice = dto.answer_checkbox.some(a => a.checkboxFieldId === cf.id)
                if (!hasChoice) throw new BadRequestException({ errorCode: 'FIELD_REQUIRED', message: `Trường trắc nghiệm '${cf.title}' là bắt buộc` })
            }
        }

        // Step 4-7 — Transaction
        let submission: Submissions = await this.dataSource.transaction(async (manager) => {
            // Step 4 — Upsert submission
            let savedSubmission: Submissions
            if (existingSubmission) {
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
                    file_name: a.file_name,
                    input_type: a.input_type,
                    submission: { id: savedSubmission.id } as DeepPartial<Submissions>
                }))

            const answersToUpdate = dto.answer.filter(a => !!a.id)

            await Promise.all([
                answersToCreate.length ? manager.save(SubmissionAnswers, answersToCreate) : Promise.resolve(),
                ...answersToUpdate.map(async a => {
                    const result = await manager.update(SubmissionAnswers,
                        { id: a.id, submission: savedSubmission.id },
                        { body: a.body, file_name: a.file_name, input_type: a.input_type }
                    )
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
                    const result = await manager.update(SubmissionCheckboxes,
                        { id: a.id, submission: savedSubmission.id },
                        { checkboxField: { id: a.checkboxFieldId }, fieldChoices: { id: a.fieldChoicesId } }
                    )
                    if (!result.affected) throw new NotFoundException({ errorCode: 'ANSWER_CHECKBOX_NOT_FOUND', message: `Câu trả lời trắc nghiệm ${a.id} không tồn tại` })
                })
            ])

            return savedSubmission
        })

        // Step 7 — Return detailed submission
        console.log(submission)
        return await this.getSubmissionDetail({
            userId: userId,
            classId: form.class.id,
            formId: form.id
        }, req)
    }
}
