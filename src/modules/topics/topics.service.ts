import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, In, Repository } from "typeorm";
import { Topics } from "src/entities/topics.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Milestones } from "src/entities/milestones.en";
import { Users } from "src/entities/user.en";
import { MainRole, RoomRole, ThesisType, TopicStatus } from "src/enums/enums";
import { CancelInviteDTO, CreateTopicDTO, InviteSupervisorDTO, LecturerTopicQueryDTO, ReviewTopicDTO, SubmitOutlineDTO, SupervisorResponseDTO, TopicQueryDTO } from "./topics.dto";
import { isUUID } from "class-validator";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import { TopicsGateway } from "./topics.gateway";
import { MailService } from "../notifications/mail.service";

@Injectable()
export class TopicsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly topicsGateway: TopicsGateway,
        private readonly mailService: MailService,
        @InjectRepository(Topics)
        private readonly topics: Repository<Topics>,
        @InjectRepository(ClassMembers)
        private readonly classMembers: Repository<ClassMembers>,
        @InjectRepository(Milestones)
        private readonly milestones: Repository<Milestones>,
        @InjectRepository(Users)
        private readonly users: Repository<Users>,
    ) { }

    // POST — Upload file đề cương lên Supabase Storage
    async uploadOutlineFile(file: any, oldUrl: string | undefined, req: Request | any): Promise<{ url: string }> {
        const client = req.userData
        const supabase = createClient(
            this.configService.get<string>('SUPABASE_URL')!,
            this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Xóa file cũ nếu FE truyền oldUrl lên
        if (oldUrl) {
            const oldPath = oldUrl.split('/Outline/')[1]
            if (oldPath) await supabase.storage.from('Outline').remove([oldPath])
        }

        const ext = file.originalname.split('.').pop()
        const path = `outlines/${client.id}_${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('Outline').upload(path, file.buffer, { contentType: file.mimetype, upsert: true })
        if (error) throw new BadRequestException(error.message)
        const { data } = supabase.storage.from('Outline').getPublicUrl(path)
        console.log('Outline URL:', data.publicUrl)
        return { url: data.publicUrl }
    }

    async deleteOutlineFile(url: string, req: Request | any): Promise<void> {
        if (!url) return
        const supabase = createClient(
            this.configService.get<string>('SUPABASE_URL')!,
            this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
        )
        const path = url.split('/Outline/')[1]
        if (path) await supabase.storage.from('Outline').remove([path])
    }

    // GET — danh sách đề tài của lecturer hiện tại trong 1 lớp (với tư cách GVHD hoặc GVPB)
    async getMyTopics(query: LecturerTopicQueryDTO, req: Request | any) {
        const { classId, milestoneId } = query
        const client = req.userData
        if (!classId) throw new BadRequestException("Data is invalid")

        const queryBuilder = this.topics.createQueryBuilder('topic')
            .leftJoinAndSelect('topic.student', 'student')
            .leftJoinAndSelect('topic.supervisor', 'supervisor')
            .leftJoinAndSelect('topic.reviewer', 'reviewer')
            .leftJoinAndSelect('topic.milestone', 'milestone')
            .leftJoinAndSelect('milestone.progress', 'progress')
            .where('progress.class = :classId', { classId })
            .andWhere(new Brackets(qb => {
                qb.where('topic.supervisor_id = :userId', { userId: client.id })
                    .orWhere('topic.reviewer_id = :userId', { userId: client.id })
            }))

        if (milestoneId) {
            queryBuilder.andWhere('topic.milestone_id = :milestoneId', { milestoneId })
        }

        return queryBuilder.orderBy('topic.created_at', 'DESC').getMany()
    }

    // GET — danh sách đề tài theo class/milestone
    async getTopics(query: TopicQueryDTO, req: Request | any) {
        const { classId, milestoneId } = query
        if (!classId || !isUUID(classId)) throw new BadRequestException("Data is invalid")

        const client = req.userData
        const where: any = { milestone: { progress: { class: { id: classId } } } }

        if (client.role !== MainRole.UNIADMIN) {
            const member = await this.classMembers.findOne({
                where: { class: { id: classId }, user: { id: client.id } }
            })
            if (!member) throw new ForbiddenException("Access denied")

            if (member.role !== RoomRole.ROOMADMIN) {
                where.milestone.progress.created_approval = true
            }
        }

        if (milestoneId) {
            if (!isUUID(milestoneId)) throw new BadRequestException("Data is invalid")
            where.milestone.id = milestoneId
        }

        return this.topics.find({
            where,
            relations: { student: true, supervisor: true, reviewer: true, milestone: true },
            select: {
                id: true,
                student: { id: true, full_name: true, email: true },
                supervisor: { id: true, full_name: true, email: true },
                reviewer: { id: true, full_name: true, email: true },
                milestone: { id: true, label: true }
            },
            order: { created_at: "DESC" }
        })
    }

    // GET — chi tiết 1 đề tài
    async getOneTopic(id: string, req: Request | any) {
        if (!isUUID(id)) throw new BadRequestException("Data is invalid")
        const topic = await this.topics.findOne({
            where: { id },
            relations: { student: true, supervisor: true, reviewer: true, milestone: { progress: { class: true } } },
            select: {
                id: true,
                student: { id: true, full_name: true, email: true },
                supervisor: { id: true, full_name: true, email: true },
                reviewer: { id: true, full_name: true, email: true },
                milestone: {
                    id: true, label: true, is_registration_milestone: true,
                    progress: { id: true, created_approval: true, class: { id: true } }
                }
            }
        })
        if (!topic) throw new NotFoundException("Topic not found")

        const client = req.userData
        if (client.role !== MainRole.UNIADMIN) {
            const classId = topic.milestone?.progress?.class?.id
            if (!classId) throw new NotFoundException("Class not found")

            const member = await this.classMembers.findOne({
                where: { class: { id: classId }, user: { id: client.id } }
            })

            if (!member) throw new ForbiddenException("Access denied")

            if (member.role !== RoomRole.ROOMADMIN && topic.milestone?.progress && !topic.milestone.progress.created_approval) {
                throw new ForbiddenException("Quy trình của lớp học này chưa được phê duyệt")
            }
        }

        return topic
    }

    // POST — Student tạo đề tài
    async createTopic(dto: CreateTopicDTO, req: Request | any) {
        const { milestoneId, classId, title, description, thesis_type } = dto
        const client = req.userData

        if (!isUUID(milestoneId) || !isUUID(classId)) throw new BadRequestException("Data is invalid")

        // Chỉ student trong lớp mới được tạo
        const member = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.STUDENT, is_deleted: false, is_banned: false }
        })
        if (!member) throw new ForbiddenException("Access denied")

        // Milestone phải là registration milestone
        const milestone = await this.milestones.findOne({
            where: { id: milestoneId, is_registration_milestone: true, progress: { class: { id: classId } } },
            relations: { progress: true }
        })
        if (!milestone) throw new NotFoundException("Registration milestone not found")

        // Guard: Progress approval check
        if (!milestone.progress.created_approval) {
            throw new ForbiddenException("Quy trình của lớp học này chưa được phê duyệt")
        }

        // Kiểm tra SV đã có topic chưa
        const existing = await this.topics.findOne({ where: { milestone: { id: milestoneId }, student: { id: client.id } } })
        if (existing) throw new BadRequestException("You already have a topic in this milestone")

        const topic = this.topics.create({ title, description, thesis_type, milestone: { id: milestoneId }, student: { id: client.id } })
        return this.topics.save(topic)
    }

    // PATCH — Student mời GVHD
    async inviteSupervisor(id: string, dto: InviteSupervisorDTO, req: Request | any) {
        const { classId, supervisorId } = dto
        const client = req.userData

        if (!isUUID(id) || !isUUID(classId) || !isUUID(supervisorId)) throw new BadRequestException("Data is invalid")

        const topic = await this.topics.findOne({
            where: { id, student: { id: client.id } },
            relations: { milestone: { progress: true } }
        })
        if (!topic) throw new NotFoundException("Topic not found")

        // Guard: Progress approval check
        if (topic.milestone?.progress && !topic.milestone.progress.created_approval) {
            throw new ForbiddenException("Quy trình của lớp học này chưa được phê duyệt")
        }

        if (![TopicStatus.DRAFT, TopicStatus.SUPERVISOR_REJECTED].includes(topic.status))
            throw new BadRequestException("Cannot invite supervisor at this stage")

        // Supervisor phải là lecturer trong lớp
        const supervisorMember = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: supervisorId }, role: RoomRole.LECTURER, is_deleted: false, is_banned: false }
        })
        if (!supervisorMember) throw new NotFoundException("Supervisor not found in this class")

        await this.topics.update(id, { supervisor: { id: supervisorId }, status: TopicStatus.INVITED })
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId })
        return result
    }

    // PATCH — Lecturer accept/reject
    async supervisorResponse(id: string, dto: SupervisorResponseDTO, req: Request | any) {
        const { classId, accept, rejection_note } = dto
        const client = req.userData

        if (!isUUID(id)) throw new BadRequestException("Data is invalid")

        const topic = await this.topics.findOne({
            where: { id, supervisor: { id: client.id } },
            relations: { supervisor: true, milestone: { progress: true } }
        })
        if (!topic) throw new NotFoundException("Topic not found")

        // Guard: Progress approval check
        if (topic.milestone?.progress && !topic.milestone.progress.created_approval) {
            throw new ForbiddenException("Quy trình của lớp học này chưa được phê duyệt")
        }

        if (topic.status !== TopicStatus.INVITED) throw new BadRequestException("Topic is not awaiting supervisor response")

        if (accept) {
            const acceptedStatuses = [TopicStatus.SUPERVISOR_ACCEPTED, TopicStatus.OUTLINE_PENDING, TopicStatus.OUTLINE_REJECTED, TopicStatus.APPROVED]
            const count = await this.topics.count({
                where: {
                    supervisor: { id: client.id },
                    thesis_type: topic.thesis_type,
                    status: In(acceptedStatuses),
                    milestone: { progress: { class: { id: classId } } }
                }
            })
            const limit = topic.thesis_type === ThesisType.THESIS ? 4 : 8
            if (count >= limit) throw new BadRequestException(
                topic.thesis_type === ThesisType.THESIS
                    ? "Đã đạt giới hạn 4 khóa luận trong lớp này"
                    : "Đã đạt giới hạn 8 tiểu luận trong lớp này"
            )
        }

        const update: any = accept
            ? { status: TopicStatus.SUPERVISOR_ACCEPTED, rejection_note: null }
            : { status: TopicStatus.SUPERVISOR_REJECTED, rejection_note: rejection_note ?? null }

        await this.topics.update(id, update)
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId })
        return result
    }

    // PATCH — Student thu hồi lời mời
    async cancelInvite(id: string, dto: CancelInviteDTO, req: Request | any) {
        const client = req.userData
        if (!isUUID(id)) throw new BadRequestException("Data is invalid")

        const topic = await this.topics.findOne({ where: { id, student: { id: client.id } } })
        if (!topic) throw new NotFoundException("Topic not found")
        if (topic.status !== TopicStatus.INVITED) throw new BadRequestException("Topic is not awaiting supervisor response")

        await this.topics.update(id, { status: TopicStatus.DRAFT })
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId: dto.classId })
        return result
    }

    // PATCH — Student nộp file đề cương
    async submitOutline(id: string, dto: SubmitOutlineDTO, req: Request | any) {
        const { outline_file_url } = dto
        const client = req.userData

        if (!isUUID(id)) throw new BadRequestException("Data is invalid")

        const topic = await this.topics.findOne({
            where: { id, student: { id: client.id } },
            relations: { student: true, milestone: { progress: true } }
        })
        if (!topic) throw new NotFoundException("Topic not found")

        // Guard: Progress approval check
        if (topic.milestone?.progress && !topic.milestone.progress.created_approval) {
            throw new ForbiddenException("Quy trình của lớp học này chưa được phê duyệt")
        }

        if (topic.status !== TopicStatus.SUPERVISOR_ACCEPTED && topic.status !== TopicStatus.OUTLINE_REJECTED)
            throw new BadRequestException("Cannot submit outline at this stage")

        await this.topics.update(id, { outline_file_url, status: TopicStatus.OUTLINE_PENDING, rejection_note: null })
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId: dto.classId })
        return result
    }

    // PATCH — Duyệt đề cương (RoomAdmin duyệt bước 1, UniAdmin duyệt bước 2)
    async reviewTopic(id: string, dto: ReviewTopicDTO, req: Request | any) {
        const { approve, rejection_note } = dto
        const client = req.userData

        if (!isUUID(id)) throw new BadRequestException("Data is invalid")

        const topic = await this.topics.findOne({
            where: { id },
            relations: { milestone: { progress: { class: true } } }
        })
        if (!topic) throw new NotFoundException("Topic not found")

        const classId = topic.milestone?.progress?.class?.id
        if (!classId) throw new NotFoundException("Class not found")

        // Role-based logic
        let newStatus: TopicStatus | undefined

        // RoomAdmin Review
        if (client.role === MainRole.USER) {
            const member = await this.classMembers.findOne({
                where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN, is_deleted: false, is_banned: false }
            })
            if (!member) throw new ForbiddenException("Access denied")

            if (topic.status !== TopicStatus.OUTLINE_PENDING)
                throw new BadRequestException("Topic is not pending room admin review")

            newStatus = approve ? TopicStatus.OUTLINE_WAITING_UNIADMIN : TopicStatus.OUTLINE_REJECTED
        }
        // UniAdmin Review
        else if (client.role === MainRole.UNIADMIN) {
            newStatus = approve ? TopicStatus.APPROVED : TopicStatus.OUTLINE_REJECTED
        } else {
            throw new ForbiddenException("Access denied")
        }

        const update: any = { status: newStatus, rejection_note: approve ? null : (rejection_note ?? null) }

        await this.topics.update(id, update)
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId })
        return result
    }

    // PATCH — UniAdmin phân công GVPB
    async assignReviewer(id: string, dto: any, req: Request | any) {
        const { classId, reviewerId } = dto
        const client = req.userData

        if (!isUUID(id) || !isUUID(classId) || !isUUID(reviewerId)) throw new BadRequestException("Data is invalid")

        // Chỉ UNIADMIN mới được phân công
        if (client.role !== MainRole.UNIADMIN) {
            throw new ForbiddenException("Only UNIADMIN can assign reviewer")
        }

        const topic = await this.topics.findOne({
            where: { id, milestone: { progress: { class: { id: classId } } } },
            relations: { supervisor: true, milestone: { progress: { class: true } } }
        })
        if (!topic) throw new NotFoundException("Topic not found")

        // Chỉ Tiểu luận (capstone) mới cần GVPB
        if (topic.thesis_type !== ThesisType.CAPSTONE)
            throw new BadRequestException("Chỉ Tiểu luận tốt nghiệp mới cần giảng viên phản biện")

        // Chỉ được chỉ định khi đề tài đã được duyệt
        if (topic.status !== TopicStatus.APPROVED)
            throw new BadRequestException("Chỉ có thể chỉ định GVPB cho đề tài đã được duyệt")

        // GVPB phải là lecturer trong lớp và KHÔNG được là GVHD của chính đề tài đó
        const reviewerMember = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: reviewerId }, role: RoomRole.LECTURER, is_deleted: false, is_banned: false }
        })
        if (!reviewerMember) throw new BadRequestException("Reviewer must be a lecturer in this class")
        if (reviewerId === topic.supervisor?.id) throw new BadRequestException("Reviewer cannot be the same as supervisor")

        await this.topics.update(id, { reviewer: { id: reviewerId } })
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId })

        // Gửi email thông báo cho GVPB
        const reviewer = await this.users.findOne({ where: { id: reviewerId }, select: { id: true, email: true, full_name: true } })
        if (reviewer?.email) {
            const className = topic.milestone?.progress?.class?.label ?? "lớp học"
            const html = `
            <div style="background-color:#f9fafb;padding:40px 0;font-family:'Segoe UI',sans-serif;">
                <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
                    <div style="background-color:#499C40;padding:24px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:20px;text-transform:uppercase;letter-spacing:2px;font-weight:800;">UniProject</h1>
                    </div>
                    <div style="padding:40px;">
                        <p style="color:#6b7280;font-size:12px;font-weight:800;margin-bottom:8px;text-transform:uppercase;letter-spacing:1.5px;">Phân công phản biện</p>
                        <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 20px 0;">Bạn được chỉ định làm Giảng viên phản biện</h2>
                        <div style="background:#f3f4f6;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
                            <table style="width:100%;border-collapse:collapse;">
                                <tr><td style="color:#6b7280;font-size:13px;padding-bottom:10px;width:120px;font-weight:600;">Đề tài:</td><td style="color:#111827;font-size:14px;font-weight:700;padding-bottom:10px;">${topic.title}</td></tr>
                                <tr><td style="color:#6b7280;font-size:13px;font-weight:600;">Lớp học:</td><td style="color:#111827;font-size:14px;font-weight:700;">${className}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="color:#9ca3af;font-size:11px;margin:0;">Đây là email tự động từ hệ thống <b>UniProject</b>.</p>
                    </div>
                </div>
            </div>`
            this.mailService.sendBulk([reviewer.email], "Bạn được chỉ định làm Giảng viên phản biện", html)
        }

        return result
    }
}
