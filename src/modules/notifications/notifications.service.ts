import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notifications } from "src/entities/notifications.en";
import { ClassMembers } from "src/entities/class_members.en";
import { NotificationsPaginationDTO, UpdateNotificationDTO } from "./notifications.dto";
import { MainRole, RoomRole } from "src/enums/enums";

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notifications)
        private readonly notificationRepo: Repository<Notifications>,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>
    ) { }

    // Get all notifications (pagination)
    async notificationsPagination(query: NotificationsPaginationDTO, req: Request | any) {
        const { classId, page, size, search } = query
        const client = req.userData

        if (!page || !size) throw new BadRequestException("Invalid data")
        if (client.role !== MainRole.UNIADMIN && !classId) throw new BadRequestException("Class ID is required")

        const pageNum = parseInt(page)
        const sizeNum = parseInt(size)

        const qb = this.notificationRepo.createQueryBuilder('n')
            .leftJoin('n.createdBy', 'createdBy')
            .leftJoin('n.class', 'class')
            .leftJoin('n.milestone', 'milestone')
            .select([
                'n.id', 'n.title', 'n.body', 'n.created_at', 'n.updated_at',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email',
                'class.id', 'class.label', 'class.join_code', 'class.subject',
                'milestone.id', 'milestone.label', 'milestone.description',
            ])
            .skip((pageNum - 1) * sizeNum)
            .take(sizeNum)
            .orderBy('n.created_at', 'DESC')

        if (classId) qb.andWhere('class.id = :classId', { classId })
        if (search) qb.andWhere(
            '(n.title ILIKE :search OR n.body ILIKE :search OR class.label ILIKE :search OR createdBy.full_name ILIKE :search OR createdBy.email ILIKE :search)',
            { search: `%${search}%` }
        )

        const [data, total] = await qb.getManyAndCount()

        return {
            data,
            pagination: { total, page: pageNum, size: sizeNum, totalPages: Math.ceil(total / sizeNum) }
        }
    }

    // Get one notification (get detail)
    async getNotification(id: string) {
        const notification = await this.findWithRelations(id)
        if (!notification) throw new NotFoundException("Notification not found")
        return notification
    }

    private findWithRelations(id: string) {
        return this.notificationRepo.findOne({
            where: { id },
            relations: ['createdBy', 'class', 'milestone'],
            select: {
                id: true, title: true, body: true, created_at: true, updated_at: true,
                createdBy: { id: true, full_name: true, email: true },
                class: { id: true, label: true, join_code: true, subject: true },
                milestone: { id: true, label: true, description: true },
            }
        })
    }

    // Update notification
    async updateNotification(body: UpdateNotificationDTO, req: Request | any) {
        const { id, title, body: bodyText, classId, milestoneId } = body

        if (id) {
            const notification = await this.notificationRepo.findOne({ where: { id } })
            if (!notification) throw new NotFoundException("Notification not found")

            await this.notificationRepo.update(id, {
                title,
                body: bodyText,
                class: { id: classId },
                milestone: milestoneId ? { id: milestoneId } : null,
            })

            return this.findWithRelations(id)
        }

        const saved = await this.notificationRepo.save(
            this.notificationRepo.create({
                title,
                body: bodyText,
                class: { id: classId },
                createdBy: { id: req.userData.id },
                milestone: milestoneId ? { id: milestoneId } : null,
            })
        )

        return this.findWithRelations(saved.id)
    }

    // Remove notification
    async removeNotification(id: string, req: Request | any) {
        const client = req.userData

        const notification = await this.notificationRepo.findOne({
            where: { id },
            relations: ['class'],
            select: { id: true, class: { id: true } }
        })
        if (!notification) throw new NotFoundException("Notification not found")

        if (client.role !== MainRole.UNIADMIN) {
            const member = await this.classMemberRepo.findOne({
                where: { class: { id: notification.class.id }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
            })
            if (!member) throw new ForbiddenException("Access denied")
        }

        await this.notificationRepo.delete(id)
        return { message: "Deleted successfully" }
    }

}