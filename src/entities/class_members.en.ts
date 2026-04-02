import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Enum
import { RoomRole } from "src/enums/enums";
import { Classes } from "./classes.en";
import { Users } from "./user.en";

@Entity('class_members')
@Index(['class', 'user'], { unique: true })
export class ClassMembers {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'enum', enum: RoomRole, default: RoomRole.STUDENT })
    role: RoomRole

    @Column({ type: 'boolean', default: false })
    roomadmin_approved: boolean

    @Column({ type: 'boolean', default: false })
    is_banned: boolean

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean

    @Column({ type: 'boolean', default: false })
    is_committee_member: boolean

    @Column({ type: 'boolean', default: false })
    can_create_notifications: boolean

    @Column({ type: 'boolean', default: false })
    can_create_forms: boolean

    @Column({ type: 'boolean', default: false })
    can_create_score_forms: boolean

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    joined_at: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date

    // Relations
    @ManyToOne(() => Classes, (cls) => cls.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class' })
    class: Classes;

    @ManyToOne(() => Users, (user) => user.classMember, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Users
}