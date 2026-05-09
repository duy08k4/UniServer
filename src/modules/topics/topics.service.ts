import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Topics } from "src/entities/topics.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Milestones } from "src/entities/milestones.en";
import { RoomRole, ThesisType, TopicStatus } from "src/enums/enums";
import { CancelInviteDTO, CreateTopicDTO, InviteSupervisorDTO, LecturerTopicQueryDTO, ReviewTopicDTO, SubmitOutlineDTO, SupervisorResponseDTO, TopicQueryDTO } from "./topics.dto";
import { isUUID } from "class-validator";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import { TopicsGateway } from "./topics.gateway";

@Injectable()
export class TopicsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly topicsGateway: TopicsGateway,
        @InjectRepository(Topics)
        private readonly topics: Repository<Topics>,
        @InjectRepository(ClassMembers)
        private readonly classMembers: Repository<ClassMembers>,
        @InjectRepository(Milestones)
        private readonly milestones: Repository<Milestones>,
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

    // GET — danh sách đề tài của lecturer hiện tại trong 1 lớp
    async getMyTopics(query: LecturerTopicQueryDTO, req: Request | any) {
        const { classId, milestoneId } = query
        const client = req.userData
        if (!classId) throw new BadRequestException("Data is invalid")

        const where: any = {
            supervisor: { id: client.id },
            milestone: { progress: { class: { id: classId } } }
        }
        if (milestoneId) where.milestone = { id: milestoneId, progress: { class: { id: classId } } }

        return this.topics.find({
            where,
            relations: { student: true, supervisor: true, milestone: true },
            select: {
                student: { id: true, full_name: true, email: true },
                supervisor: { id: true, full_name: true, email: true },
                milestone: { id: true, label: true, is_registration_milestone: true }
            },
            order: { created_at: "DESC" }
        })
    }

    // GET — danh sách đề tài theo class/milestone
    async getTopics(query: TopicQueryDTO, req: Request | any) {
        const { classId, milestoneId } = query
        if (!classId || !isUUID(classId)) throw new BadRequestException("Data is invalid")

        const where: any = { milestone: { progress: { class: { id: classId } } } }
        if (milestoneId) {
            if (!isUUID(milestoneId)) throw new BadRequestException("Data is invalid")
            where.milestone = { id: milestoneId }
        }

        return this.topics.find({
            where,
            relations: { student: true, supervisor: true, milestone: true },
            select: {
                student: { id: true, full_name: true, email: true },
                supervisor: { id: true, full_name: true, email: true },
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
            relations: { student: true, supervisor: true, milestone: true },
            select: {
                student: { id: true, full_name: true, email: true },
                supervisor: { id: true, full_name: true, email: true },
                milestone: { id: true, label: true, is_registration_milestone: true }
            }
        })
        if (!topic) throw new NotFoundException("Topic not found")
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
            where: { id: milestoneId, is_registration_milestone: true, progress: { class: { id: classId } } }
        })
        if (!milestone) throw new NotFoundException("Registration milestone not found")

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

        const topic = await this.topics.findOne({ where: { id, student: { id: client.id } }, relations: { milestone: true } })
        if (!topic) throw new NotFoundException("Topic not found")
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

        const topic = await this.topics.findOne({ where: { id, supervisor: { id: client.id } }, relations: { supervisor: true } })
        if (!topic) throw new NotFoundException("Topic not found")
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

        const topic = await this.topics.findOne({ where: { id, student: { id: client.id } }, relations: { student: true } })
        if (!topic) throw new NotFoundException("Topic not found")
        if (topic.status !== TopicStatus.SUPERVISOR_ACCEPTED && topic.status !== TopicStatus.OUTLINE_REJECTED)
            throw new BadRequestException("Cannot submit outline at this stage")

        await this.topics.update(id, { outline_file_url, status: TopicStatus.OUTLINE_PENDING, rejection_note: null })
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId: dto.classId })
        return result
    }

    // PATCH — RoomAdmin duyệt đề cương
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

        const member = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: client.id }, role: RoomRole.ROOMADMIN, is_deleted: false, is_banned: false }
        })
        if (!member) throw new ForbiddenException("Access denied")

        if (topic.status === TopicStatus.SUPERVISOR_REJECTED || topic.status === TopicStatus.SUPERVISOR_ACCEPTED || topic.status === TopicStatus.DRAFT ||  topic.status === TopicStatus.INVITED) throw new BadRequestException("Topic is not pending review")

        const update: any = approve
            ? { status: TopicStatus.APPROVED, rejection_note: null }
            : { status: TopicStatus.OUTLINE_REJECTED, rejection_note: rejection_note ?? null }

        await this.topics.update(id, update)
        const result = await this.getOneTopic(id, req)
        this.topicsGateway.topicUpdated({ topicId: id, classId })
        return result
    }
}
