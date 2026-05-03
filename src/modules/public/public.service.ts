import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubmissionAnswers } from "@app/entities/submission_answers.en";
import { Topics } from "@app/entities/topics.en";
import { Users } from "@app/entities/user.en";
import { GetThesesDTO } from "./public.dto";
import { Field_Label, Field_Type, SubmissionStatus } from "@app/enums/enums";

@Injectable()
export class PublicService {
    constructor(
        @InjectRepository(SubmissionAnswers)
        private readonly answerRepo: Repository<SubmissionAnswers>,
        @InjectRepository(Topics)
        private readonly topicsRepo: Repository<Topics>
    ) {}

    private baseQuery() {
        return this.answerRepo.createQueryBuilder('sa')
            .innerJoin('sa.field', 'field',
                'field.label = :label AND sa.input_type = :type',
                { label: Field_Label.FINAL_THESIS, type: Field_Type.FILE }
            )
            .innerJoin('sa.submission', 'sub', 'sub.status = :status', { status: SubmissionStatus.ACCEPT })
            .innerJoin('sub.user', 'student')
            .innerJoin('sub.form', 'form')
            .innerJoin('form.milestone', 'milestone')
            .innerJoin(Topics, 'topic', 'topic.student_id = student.id AND topic.milestone_id IN (SELECT m.id FROM milestones m JOIN progresses p ON m.progress = p.id WHERE p.class = form.class)')
            .leftJoin(Users, 'supervisor', 'supervisor.id = topic.supervisor_id')
            .select('sa.id', 'id')
            .addSelect('sa.body', 'file_url')
            .addSelect('sa.file_name', 'file_name')
            .addSelect('sub.created_at', 'submitted_at')
            .addSelect('student.full_name', 'student_name')
            .addSelect('topic.title', 'title')
            .addSelect('topic.thesis_type', 'thesis_type')
            .addSelect('topic.outline_file_url', 'outline_file_url')
            .addSelect('supervisor.full_name', 'supervisor_name')
    }

    private applyFilters(qb: ReturnType<typeof this.baseQuery>, query: GetThesesDTO) {
        const { search, thesis_type, date_from, date_to } = query
        if (search) {
            qb.andWhere(
                `(unaccent(topic.title) ILIKE unaccent(:search) OR unaccent(student.full_name) ILIKE unaccent(:search))`,
                { search: `%${search}%` }
            )
        }
        if (thesis_type) qb.andWhere('topic.thesis_type = :thesis_type', { thesis_type })
        if (date_from) qb.andWhere('sub.created_at >= :date_from', { date_from: new Date(date_from) })
        if (date_to) qb.andWhere('sub.created_at <= :date_to', { date_to: new Date(date_to) })
        return qb
    }

    async getTheses(query: GetThesesDTO) {
        const { page, size } = query
        if (!page || !size) throw new BadRequestException('page and size are required')

        const p = parseInt(page)
        const s = parseInt(size)

        const total = await this.applyFilters(this.baseQuery(), query).getCount()
        const data = await this.applyFilters(this.baseQuery(), query)
            .offset((p - 1) * s)
            .limit(s)
            .getRawMany()

        return {
            data,
            pagination: { page: p, size: s, total, totalPage: Math.ceil(total / s) }
        }
    }

    async getOneThesis(id: string) {
        if (!id) throw new BadRequestException('id is required')

        const item = await this.baseQuery()
            .andWhere('sa.id = :id', { id })
            .getRawOne()

        if (!item) throw new NotFoundException('Thesis not found')

        return item
    }
}
