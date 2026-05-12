import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notifications } from "src/entities/notifications.en";
import { ClassMembers } from "src/entities/class_members.en";
import { NotificationsPaginationDTO, UpdateNotificationDTO } from "./notifications.dto";
import { MainRole, RoomRole } from "src/enums/enums";
import { MailService } from "./mail.service";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { Forms } from "src/entities/forms.en";
import { NotificationGateway } from "./notifications.gateway";

@Injectable()
export class NotificationsService {
    constructor(
        private readonly notificationGateway: NotificationGateway,
        @InjectRepository(Notifications)
        private readonly notificationRepo: Repository<Notifications>,
        @InjectRepository(ClassMembers)
        private readonly classMemberRepo: Repository<ClassMembers>,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
    ) { }

    // Get notification (pagination)
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
            .leftJoin('n.forms', 'forms')
            .select([
                'n.id', 'n.title', 'n.body', 'n.created_at', 'n.updated_at',
                'createdBy.id', 'createdBy.full_name', 'createdBy.email',
                'class.id', 'class.label', 'class.join_code', 'class.subject',
                'milestone.id', 'milestone.label',
                'forms.id', 'forms.label', 'forms.is_stopped',
            ])
            .skip((pageNum - 1) * sizeNum)
            .take(sizeNum)
            .orderBy('n.created_at', 'DESC')

        if (classId) qb.andWhere('class.id = :classId', { classId })
        if (search) qb.andWhere(
            '(n.title ILIKE :search OR class.label ILIKE :search OR createdBy.full_name ILIKE :search)',
            { search: `%${search}%` }
        )

        const [data, total] = await qb.getManyAndCount()
        return { data, pagination: { total, page: pageNum, size: sizeNum, totalPages: Math.ceil(total / sizeNum) } }
    }

    // Get notification (detail)
    async getNotification(id: string) {
        const notification = await this.findWithRelations(id)
        if (!notification) throw new NotFoundException("Notification not found")
        return notification
    }

    private findWithRelations(id: string) {
        return this.notificationRepo.findOne({
            where: { id },
            relations: ['createdBy', 'class', 'milestone', 'forms'],
            select: {
                id: true, title: true, body: true, created_at: true, updated_at: true,
                createdBy: { id: true, full_name: true, email: true },
                class: { id: true, label: true },
                milestone: { id: true, label: true },
                forms: { id: true, label: true, is_stopped: true },
            }
        })
    }

    // Update and create notification
    async updateNotification(body: UpdateNotificationDTO, req: Request | any) {
        const { id, title, body: bodyText, classId, milestoneId, formIds } = body

        const result = await this.dataSource.transaction(async (manager) => {
            let notification: Notifications

            if (id) {
                const existing = await manager.findOne(Notifications, { where: { id } })
                if (!existing) throw new NotFoundException("Notification not found")

                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
                if (existing.created_at < oneDayAgo) throw new ForbiddenException("Cannot edit notification older than 1 day")

                await manager.update(Notifications, id, {
                    title,
                    body: bodyText,
                    milestone: milestoneId ? { id: milestoneId } : null,
                })
                notification = await manager.findOne(Notifications, { where: { id } }) as Notifications
            } else {
                notification = await manager.save(
                    manager.create(Notifications, {
                        title,
                        body: bodyText,
                        class: { id: classId },
                        createdBy: { id: req.userData.id },
                        milestone: milestoneId ? { id: milestoneId } : null,
                    })
                )
            }

            // Sync forms
            const notificationWithForms = await manager.findOne(Notifications, {
                where: { id: notification.id },
                relations: ['forms'],
            })
            if (notificationWithForms) {
                notificationWithForms.forms = formIds && formIds.length > 0
                    ? formIds.map(fid => ({ id: fid } as Forms))
                    : []
                await manager.save(Notifications, notificationWithForms)
            }

            return notification
        })

        const fullData = await this.findWithRelations(result.id)

        // Email logic (only for new notifications)
        if (!id && fullData) {
            this.classMemberRepo.find({
                where: { class: { id: classId }, is_deleted: false, is_banned: false },
                relations: { user: true },
                select: { user: { email: true } }
            }).then(members => {
                const emails = members.map(m => m.user.email).filter(Boolean)

                const html = `
                <div style="background-color: #f9fafb; padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                        <div style="background-color: #499C40; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">UniProject</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p style="color: #6b7280; font-size: 12px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1.5px;">Thông báo mới</p>
                            <h2 style="color: #111827; font-size: 24px; font-weight: 800; margin: 0 0 24px 0; line-height: 1.3;">${title}</h2>
                            
                            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="color: #6b7280; font-size: 13px; padding-bottom: 10px; width: 100px; font-weight: 600;">Lớp học:</td>
                                        <td style="color: #111827; font-size: 14px; font-weight: 700; padding-bottom: 10px;">${fullData.class.label}</td>
                                    </tr>
                                    ${fullData.milestone ? `
                                    <tr>
                                        <td style="color: #6b7280; font-size: 13px; padding-bottom: 10px; font-weight: 600;">Cột mốc:</td>
                                        <td style="color: #111827; font-size: 14px; font-weight: 700; padding-bottom: 10px;">${fullData.milestone.label}</td>
                                    </tr>` : ''}
                                    <tr>
                                        <td style="color: #6b7280; font-size: 13px; font-weight: 600;">Người gửi:</td>
                                        <td style="color: #111827; font-size: 14px; font-weight: 700;">${fullData.createdBy.full_name}</td>
                                    </tr>
                                </table>
                            </div>

                        </div>
                        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.5;">
                                Đây là email tự động từ hệ thống quản lý đồ án <b>UniProject</b>.<br>
                                Bạn nhận được email này vì bạn là thành viên của lớp học.
                            </p>
                        </div>
                    </div>
                </div>
                `

                this.mailService.sendBulk(emails, `[UniProject] Thông báo mới: ${title}`, html)
            })
        }

        this.notificationGateway.updateNotification({ notificationId: fullData ? fullData.id : "", classId: fullData ? fullData.class.id : "" })

        return fullData
    }

    // Remove notification
    async removeNotification(id: string, req: Request | any) {
        const client = req.userData
        const notification = await this.notificationRepo.findOne({
            where: { id }, relations: ['class'], select: { id: true, class: { id: true } }
        })
        if (!notification) throw new NotFoundException("Notification not found")

        if (client.role !== MainRole.UNIADMIN) {
            const member = await this.classMemberRepo.findOne({
                where: { class: { id: notification.class.id }, user: { id: client.id }, role: RoomRole.ROOMADMIN }
            })
            if (!member) throw new ForbiddenException("Access denied")
        }

        await this.notificationRepo.delete(id)
        this.notificationGateway.removeNotification({ notificationId: id, classId: notification.class.id })
        return { message: "Deleted successfully" }
    }
}
