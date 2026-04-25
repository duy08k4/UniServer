import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Committees } from "src/entities/committees.en";
import { CommitteeMembers } from "src/entities/committee_members.en";
import { ClassMembers } from "src/entities/class_members.en";
import { Topics } from "src/entities/topics.en";
import { CommitteeRole, MainRole, RoomRole } from "src/enums/enums";
import { UpsertCommitteeDTO } from "./committees.dto";
import { isUUID } from "class-validator";

@Injectable()
export class CommitteesService {
    constructor(
        @InjectRepository(Committees)
        private readonly committees: Repository<Committees>,
        @InjectRepository(CommitteeMembers)
        private readonly committeeMembers: Repository<CommitteeMembers>,
        @InjectRepository(ClassMembers)
        private readonly classMembers: Repository<ClassMembers>,
        @InjectRepository(Topics)
        private readonly topics: Repository<Topics>,
    ) { }

    async upsert(dto: UpsertCommitteeDTO, req: Request | any) {
        const { classId, milestoneId, members } = dto
        const client = req.userData

        if (!isUUID(classId) || !isUUID(milestoneId)) {
            throw new BadRequestException("Invalid data")
        }

        // Check ROOMADMIN permission
        const classMember = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: client.id } },
            relations: { class: true }
        })

        if (!classMember || classMember.role !== RoomRole.ROOMADMIN) {
            throw new ForbiddenException("Only ROOMADMIN can manage committee")
        }

        // Validate required roles
        const roles = members.map(m => m.role)
        const requiredRoles = [CommitteeRole.CHAIRMAN, CommitteeRole.REVIEWER, CommitteeRole.MEMBER]
        const hasAllRequired = requiredRoles.every(r => roles.includes(r))

        if (!hasAllRequired) {
            throw new BadRequestException("Committee must have CHAIRMAN, REVIEWER, and MEMBER")
        }

        // Validate all users are LECTURER in class
        const userIds = members.map(m => m.userId)
        const uniqueUserIds = [...new Set(userIds)]
        
        const lecturers = await this.classMembers.find({
            where: {
                class: { id: classId },
                user: { id: In(uniqueUserIds) },
                role: RoomRole.LECTURER
            },
            relations: { user: true }
        })

        if (lecturers.length !== uniqueUserIds.length) {
            throw new BadRequestException("All committee members must be LECTURER in this class")
        }

        // Get supervisors in class to exclude them
        const supervisors = await this.topics.find({
            where: { milestone: { progress: { class: { id: classId } } } },
            relations: { supervisor: true },
            select: { supervisor: { id: true } }
        })

        const supervisorIds = supervisors
            .filter(t => t.supervisor)
            .map(t => t.supervisor.id)

        const hasSupervisor = uniqueUserIds.some(uid => supervisorIds.includes(uid))
        if (hasSupervisor) {
            throw new BadRequestException("Supervisor cannot be in committee of their own students")
        }

        // Delete old committee if exists
        const existingCommittee = await this.committees.findOne({
            where: { class: { id: classId } },
            relations: { members: true }
        })

        if (existingCommittee) {
            await this.committees.remove(existingCommittee)
        }

        // Create new committee
        const committee = this.committees.create({
            class: { id: classId },
            milestone: { id: milestoneId }
        })

        await this.committees.save(committee)

        // Create members
        const memberEntities = members.map(m => this.committeeMembers.create({
            committee: { id: committee.id },
            user: { id: m.userId },
            role: m.role
        }))

        await this.committeeMembers.save(memberEntities)

        return this.getByClassId(classId, req)
    }

    async getByClassId(classId: string, req: Request | any) {
        if (!isUUID(classId)) {
            throw new BadRequestException("Invalid class ID")
        }

        const client = req.userData

        // Check if user is in class
        const classMember = await this.classMembers.findOne({
            where: { class: { id: classId }, user: { id: client.id } }
        })

        if (!classMember && client.role !== MainRole.UNIADMIN) {
            throw new ForbiddenException("You are not in this class")
        }

        const committee = await this.committees.findOne({
            where: { class: { id: classId } },
            relations: {
                class: true,
                milestone: true,
                members: { user: true }
            },
            select: {
                class: { id: true, label: true },
                milestone: { id: true, label: true },
                members: {
                    id: true,
                    role: true,
                    user: { id: true, full_name: true, email: true }
                }
            }
        })

        if (!committee) {
            throw new NotFoundException("Committee not found for this class")
        }

        return committee
    }

    async deleteById(id: string, req: Request | any) {
        if (!isUUID(id)) {
            throw new BadRequestException("Invalid committee ID")
        }

        const client = req.userData

        // Only UNIADMIN can delete
        if (client.role !== MainRole.UNIADMIN) {
            throw new ForbiddenException("Only UNIADMIN can delete committee")
        }

        const committee = await this.committees.findOne({ where: { id } })

        if (!committee) {
            throw new NotFoundException("Committee not found")
        }

        await this.committees.remove(committee)

        return { message: "Committee deleted successfully" }
    }
}
